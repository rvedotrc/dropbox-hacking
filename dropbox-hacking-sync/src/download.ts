import { files } from "dropbox";
import * as fs from "fs";
import * as path from "path";

import * as engine from "./engine.js";
import { DirectoryItem, FileItem } from "./local-listing.js";
import createMkdir from "./mkdir.js";
import FileMetadata = files.FileMetadata;
import { randomUUID } from "crypto";
import { downloader } from "dropbox-hacking-downloader";
import { makeContentHash } from "dropbox-hacking-uploader";
import {
  DropboxProvider,
  formatTime,
  GlobalOptions,
  parseTime,
  writeStdout,
} from "dropbox-hacking-util";

export type AlternateProvider = (
  remote: FileMetadata,
) => Promise<string | undefined>;

export type DownloadArgs = {
  dbxp: DropboxProvider;
  dropboxPath: string;
  localPath: string;
  dryRun: boolean;
  withDelete: boolean;
  checkContentHash: boolean;
  globalOptions: GlobalOptions;
  remoteFilter?: RegExp;
  alternateProvider?: AlternateProvider;
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
        mtime: Date,
      ): Promise<void> => {
        console.info(`set mtime of ${thisLocalPath} to ${mtime.toISOString()}`);
        ++syncStats.filesToSetMtime;
        if (dryRun) return Promise.resolve();

        return fs.promises.utimes(thisLocalPath, mtime, mtime);
      };

      const useAlternate = (
        thisLocalPath: string,
        remote: files.FileMetadata,
        alternatePath: string,
      ): Promise<void> => {
        console.info(
          `useAlternate from ${remote.path_display} to ${thisLocalPath} using ${alternatePath}`,
        );
        if (dryRun) return Promise.resolve();

        return fs.promises
          .link(alternatePath, thisLocalPath)
          .catch((linkErr: Error) => {
            if ("code" in linkErr && linkErr.code === "EXDEV") {
              const id = randomUUID().toString();
              const tmpLocal = `${thisLocalPath}.tmp.dbxsync.${id}`;
              const mtime = parseTime(remote.client_modified);

              return fs.promises
                .copyFile(alternatePath, tmpLocal)
                .then(() => fs.promises.chmod(tmpLocal, 0o644))
                .then(() => fs.promises.utimes(tmpLocal, mtime, mtime))
                .then(() => fs.promises.rename(tmpLocal, thisLocalPath))
                .catch((copyErr) => {
                  const reraise = () => {
                    throw copyErr;
                  };
                  return fs.promises.unlink(tmpLocal).then(reraise, reraise);
                });
            }

            throw linkErr;
          });
      };

      const doDownload = async (
        thisLocalPath: string,
        remote: files.FileMetadata,
      ): Promise<void> => {
        console.info(
          `doDownload from ${remote.path_display} to ${thisLocalPath}`,
        );

        const alternatePath = downloadArgs.alternateProvider
          ? await downloadArgs.alternateProvider(remote)
          : undefined;
        if (alternatePath !== undefined) {
          return useAlternate(thisLocalPath, remote, alternatePath);
        }

        ++syncStats.filesToDownload;
        syncStats.totalBytes += remote.size;
        if (dryRun) return Promise.resolve();

        let attempt = 0;
        const makePromise = () =>
          downloader({ dbx, local: thisLocalPath, remote });

        const tryAgain = (): Promise<void> =>
          makePromise().catch((err) => {
            console.error(
              `download #${attempt} of ${remote.path_display} failed`,
              err,
            );
            ++attempt;
            return tryAgain();
          });

        return tryAgain();
      };

      const unconditionalDownload = (
        thisLocalPath: string,
        remote: files.FileMetadata,
      ): Promise<void> => {
        debug(
          `unconditional download to [${thisLocalPath}] from ${remote.path_display}`,
        );

        return doDownload(thisLocalPath, remote);
      };

      const conditionalDownload = (
        thisLocalPath: string,
        stats: fs.Stats,
        remote: files.FileMetadata,
      ): Promise<void> =>
        isDownloadNecessary(thisLocalPath, stats, remote).then((truth) => {
          debug(
            `conditional download to [${thisLocalPath}] from ${remote.path_display} => ${truth}`,
          );

          if (truth == "set_mtime") {
            const mtime = parseTime(remote.client_modified);
            return doSetMtime(thisLocalPath, mtime);
          }

          if (truth) return doDownload(thisLocalPath, remote);

          debug(
            `no need to download to [${thisLocalPath}] from ${remote.path_display}`,
          );
          ++syncStats.filesAlreadyOk;
          return;
        });

      const isDownloadNecessary = (
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
                metadata,
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
                `already got directory [${thisLocalPath}] (${action.local.path}) for ${remotePathDisplay}`,
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
            : Promise.resolve(),
        ),
      )
        .then(() => writeStdout(JSON.stringify({ stats: syncStats }) + "\n"))
        .then(() => true);
    });
};
