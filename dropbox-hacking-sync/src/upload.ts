import { files } from "dropbox";
import * as uploader from "@blaahaj/dropbox-hacking-uploader";
import { makeContentHash } from "@blaahaj/dropbox-hacking-uploader";
import {
  DropboxProvider,
  formatTime,
  GlobalOptions,
  makePromiseLimiter,
  writeStdout,
} from "@blaahaj/dropbox-hacking-util";
import * as fs from "fs";

import * as engine from "./engine.js";
import { FileItem } from "./local-listing.js";

export type UploadArgs = {
  dbxp: DropboxProvider;
  dropboxPath: string;
  localPath: string;
  dryRun: boolean;
  withDelete: boolean;
  checkContentHash: boolean;
  globalOptions: GlobalOptions;
};

const defaultLimiter = makePromiseLimiter<void>(10, "sync-upload-limiter");

export const main = (uploadArgs: UploadArgs): Promise<boolean> => {
  const {
    dbxp,
    dropboxPath,
    localPath,
    dryRun,
    withDelete,
    checkContentHash,
    globalOptions,
  } = uploadArgs;
  return engine
    .calculate(dbxp, dropboxPath, localPath, globalOptions)
    .then(async ({ syncActions, dbx }) => {
      if ((await engine.showErrorsAndWarnings(syncActions)).hasErrors) {
        return false;
      }

      const debug = (...args: unknown[]) => {
        if (globalOptions.debugSync) console.debug(...args);
      };

      const syncStats = {
        filesToDelete: 0,
        filesToUpload: 0,
        filesAlreadyOk: 0,
        totalBytes: 0,
      };

      const mkdir = (remotePath: string): Promise<void> => {
        console.info(`mkdir ${remotePath}`);
        if (dryRun) return Promise.resolve();

        return dbx
          .filesCreateFolderV2({ path: remotePath })
          .then(() => undefined);
      };

      const doUpload = (local: FileItem, remotePath: string): Promise<void> => {
        console.info(`doUpload from ${local.path} to ${remotePath}`);
        ++syncStats.filesToUpload;
        syncStats.totalBytes += local.stat.size;
        if (dryRun) return Promise.resolve();

        const readable = fs.createReadStream(local.path);
        const commitInfo: files.CommitInfo = {
          path: remotePath,
          client_modified: formatTime(local.stat.mtime),
          mode: { ".tag": "overwrite" },
        };

        return defaultLimiter.submit(
          () =>
            uploader
              .selectUploader(local.stat.size)(
                dbx,
                commitInfo,
                readable,
                globalOptions,
              )
              .then(() => undefined)
              .finally(() => readable.close()),
          `${local.path} => ${remotePath}`,
        );
      };

      const unconditionalUpload = (
        local: FileItem,
        remotePath: string,
      ): Promise<void> => {
        debug(`unconditional upload from [${local.path}] to ${remotePath}`);

        return doUpload(local, remotePath);
      };

      const conditionalUpload = (
        local: FileItem,
        remote: files.FileMetadata,
      ): Promise<void> =>
        isUploadNecessary(local.path, local.stat, remote).then((truth) => {
          debug(
            `conditional upload from [${local.path}] to ${remote.path_display} => ${truth}`,
          );

          if (truth == "set_mtime") {
            ++syncStats.filesAlreadyOk;
            // TODO, do we have a way of doing this, apart from just re-uploading?
            return Promise.resolve();
          }

          if (truth) return doUpload(local, remote.id);

          debug(
            `no need to upload from [${local.path}] to ${remote.path_display}`,
          );
          ++syncStats.filesAlreadyOk;
          return;
        });

      const isUploadNecessary = (
        thisLocalPath: string,
        stats: fs.Stats,
        remote: files.FileMetadata,
      ): Promise<boolean | "set_mtime"> => {
        // We know that they both exist, and are files
        if (stats.size !== remote.size) return Promise.resolve(true);

        const timestampsMatch =
          formatTime(stats.mtime) === remote.client_modified;
        if (timestampsMatch && !checkContentHash) return Promise.resolve(false);

        return makeContentHash(
          fs.createReadStream(thisLocalPath, { autoClose: true }),
        ).then((hash) => {
          if (hash !== remote.content_hash) return true;

          if (!timestampsMatch) {
            return "set_mtime";
          }

          return false;
        });
      };

      const syncActionHandler = (action: engine.Action): Promise<void> => {
        if (action.local) {
          const thisRemotePath = dropboxPath + action.local.relativePath;
          const thisLocalPath = action.local.path;

          if (action.tag === "file") {
            if (action.remote) {
              return conditionalUpload(action.local, action.remote.metadata);
            } else {
              return unconditionalUpload(action.local, thisRemotePath);
            }
          } else {
            if (action.remote) {
              // Remote exists, so it must already be a directory.
              // We *could* ensure that the local directory's case is correct
              // (e.g. rename directory foo to Foo).
              debug(
                `already got directory [${action.remote.metadata.path_display}] for ${thisLocalPath}`,
              );
            } else {
              return mkdir(thisRemotePath);
            }
          }
        } else if (action.remote && withDelete) {
          const path = action.remote.metadata.path_display;
          console.info(`delete ${path}`);
          ++syncStats.filesToDelete;
          if (!dryRun) {
            // FIXME: catch the not-found case
            return dbx
              .filesDeleteV2({ path: action.remote.metadata.id })
              .then(() => undefined);
          }
        }

        return Promise.resolve();
      };

      return Promise.all(
        syncActions.map((syncAction) =>
          syncAction.action
            ? syncActionHandler(syncAction.action)
            : Promise.resolve(),
        ),
      )
        .then(() => writeStdout(JSON.stringify({ stats: syncStats }) + "\n"))
        .then(() => true);
    });
};
