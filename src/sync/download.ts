import * as fs from "fs";
import * as path from "path";
import { files } from "dropbox";
import { formatTime, parseTime, writeStdout } from "../util";
import contentHash from "../uploader/content-hash";
import * as engine from "./engine";
import createMkdir from "./mkdir";
import { DropboxProvider, GlobalOptions } from "../types";
import downloader from "../downloader";
import { DirectoryItem, FileItem } from "./local-listing";

export type DownloadArgs = {
  dbxp: DropboxProvider;
  dropboxPath: string;
  localPath: string;
  dryRun: boolean;
  withDelete: boolean;
  checkContentHash: boolean;
  globalOptions: GlobalOptions;
  remoteFilter?: RegExp;
};

export const main = (downloadArgs: DownloadArgs): Promise<boolean> => {
  const {
    dbxp,
    dropboxPath,
    localPath,
    dryRun,
    withDelete,
    checkContentHash,
    globalOptions,
    remoteFilter,
  } = downloadArgs;

  return engine
    .calculate(dbxp, dropboxPath, localPath, globalOptions)
    .then(async ({ syncActions, dbx }) => {
      const debug = (...args: unknown[]) => {
        if (globalOptions.debugSync) console.debug(...args);
      };

      const mkdir = createMkdir(dryRun);

      const syncStats = {
        filesToDelete: 0,
        filesToDownload: 0,
        filesToSetMtime: 0,
        filesAlreadyOk: 0,
        totalBytes: 0,
      };

      const doDelete = (item: FileItem | DirectoryItem): Promise<void> => {
        console.info(`delete ${item.path}`);
        if (item.tag === "file") ++syncStats.filesToDelete;
        if (dryRun) return Promise.resolve();

        // FIXME: need to handle rm-rf, and ENOENT
        if (item.tag === "file") {
          return fs.promises.unlink(item.path);
        } else {
          return fs.promises.rmdir(item.path);
        }
      };

      const doSetMtime = (
        thisLocalPath: string,
        mtime: Date
      ): Promise<void> => {
        console.info(`set mtime of ${thisLocalPath} to ${mtime}`);
        ++syncStats.filesToSetMtime;
        if (dryRun) return Promise.resolve();

        return fs.promises.utimes(thisLocalPath, mtime, mtime);
      };

      const doDownload = (
        thisLocalPath: string,
        remote: files.FileMetadata
      ): Promise<void> => {
        console.info(
          `doDownload from ${remote.path_display} to ${thisLocalPath}`
        );
        ++syncStats.filesToDownload;
        syncStats.totalBytes += remote.size;
        if (dryRun) return Promise.resolve();

        return downloader({ dbx, local: thisLocalPath, remote });
      };

      const unconditionalDownload = (
        thisLocalPath: string,
        remote: files.FileMetadata
      ): Promise<void> => {
        debug(
          `unconditional download to [${thisLocalPath}] from ${remote.path_display}`
        );

        return doDownload(thisLocalPath, remote);
      };

      const conditionalDownload = (
        thisLocalPath: string,
        stats: fs.Stats,
        remote: files.FileMetadata
      ): Promise<void> =>
        isDownloadNecessary(thisLocalPath, stats, remote).then((truth) => {
          debug(
            `conditional download to [${thisLocalPath}] from ${remote.path_display} => ${truth}`
          );

          if (truth == "set_mtime") {
            const mtime = parseTime(remote.client_modified);
            return doSetMtime(thisLocalPath, mtime);
          }

          if (truth) return doDownload(thisLocalPath, remote);

          debug(
            `no need to download to [${thisLocalPath}] from ${remote.path_display}`
          );
          ++syncStats.filesAlreadyOk;
          return;
        });

      const isDownloadNecessary = (
        thisLocalPath: string,
        stats: fs.Stats,
        remote: files.FileMetadata
      ): Promise<boolean | "set_mtime"> => {
        // We know that they both exist, and are files
        if (stats.size !== remote.size) return Promise.resolve(true);

        const timestampsMatch =
          formatTime(stats.mtime) === remote.client_modified;
        if (timestampsMatch && !checkContentHash) return Promise.resolve(false);

        return contentHash(
          fs.createReadStream(thisLocalPath, { autoClose: true })
        ).then((hash) => {
          if (hash !== remote.content_hash) return true;

          if (!timestampsMatch) {
            return "set_mtime";
          }

          return false;
        });
      };

      const syncActionHandler = (action: engine.Action): Promise<void> => {
        if (action.remote) {
          const thisLocalPath = localPath + action.remote.relativePath;
          const remotePathDisplay = action.remote.metadata.path_display;

          if (
            action.remote &&
            remoteFilter &&
            !remoteFilter.exec(action.remote.metadata.name)
          ) {
            debug(`filtering out ${action.remote.metadata.path_display}`);
            return Promise.resolve();
          }

          if (action.tag === "file") {
            const metadata = action.remote.metadata;

            if (action.local) {
              return conditionalDownload(
                thisLocalPath,
                action.local.stat,
                metadata
              );
            } else {
              return mkdir
                .mkdir(path.dirname(thisLocalPath))
                .then(() => unconditionalDownload(thisLocalPath, metadata));
            }
          } else {
            if (action.local) {
              // Local exists, so it must already be a directory.
              // We *could* ensure that the local directory's case is correct
              // (e.g. rename directory foo to Foo).
              debug(
                `already got directory [${thisLocalPath}] (${action.local.path}) for ${remotePathDisplay}`
              );
            } else {
              return mkdir.mkdir(thisLocalPath);
            }
          }
        } else if (action.local && withDelete) {
          return doDelete(action.local);
        }

        return Promise.resolve();
      };

      if ((await engine.showErrorsAndWarnings(syncActions)).hasErrors) {
        return false;
      }

      for (const syncAction of syncActions) {
        const local = syncAction.action?.local;
        if (local) {
          if (local.stat.isDirectory()) mkdir.seed(local.path);
        }
      }

      return Promise.all(
        syncActions.map((syncAction) =>
          syncAction.action
            ? syncActionHandler(syncAction.action)
            : Promise.resolve()
        )
      )
        .then(() => writeStdout(JSON.stringify({ stats: syncStats }) + "\n"))
        .then(() => true);
    });
};
