import * as fs from "fs";
import * as path from "path";
import { Dropbox, files } from "dropbox";
import { formatTime, parseTime } from "../util";
import contentHash from "../uploader/content-hash";
import * as engine from "./engine";
import * as mkdir from "./mkdir";
import { DropboxProvider } from "../types";
import downloader from "../downloader";
import { DirectoryItem, FileItem } from "./local-listing";

const doDelete = (
  item: FileItem | DirectoryItem,
  dryRun: boolean
): Promise<void> => {
  console.log(`delete ${item.path}`);
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
  dryRun: boolean
): Promise<void> => {
  console.debug(`set mtime of ${thisLocalPath} to ${mtime}`);
  if (dryRun) return Promise.resolve();

  return fs.promises.utimes(thisLocalPath, mtime, mtime);
};

const doDownload = (
  dbx: Dropbox,
  thisLocalPath: string,
  remote: files.FileMetadata,
  dryRun: boolean
): Promise<void> => {
  console.debug(`doDownload from ${remote.path_display} to ${thisLocalPath}`);
  if (dryRun) return Promise.resolve();

  return downloader(dbx, thisLocalPath, remote);
};

const unconditionalDownload = (
  dbx: Dropbox,
  thisLocalPath: string,
  remote: files.FileMetadata,
  dryRun: boolean
): Promise<void> => {
  console.log(
    `unconditional download to [${thisLocalPath}] from ${remote.path_display}`
  );

  return doDownload(dbx, thisLocalPath, remote, dryRun);
};

const conditionalDownload = (
  dbx: Dropbox,
  thisLocalPath: string,
  stats: fs.Stats,
  remote: files.FileMetadata,
  dryRun: boolean
): Promise<void> =>
  isDownloadNecessary(thisLocalPath, stats, remote).then((truth) => {
    console.log(
      `conditional download to [${thisLocalPath}] from ${remote.path_display} => ${truth}`
    );

    if (truth == "set_mtime") {
      const mtime = parseTime(remote.client_modified);
      return doSetMtime(thisLocalPath, mtime, dryRun);
    }

    if (truth) return doDownload(dbx, thisLocalPath, remote, dryRun);

    console.debug(
      `no need to download to [${thisLocalPath}] from ${remote.path_display}`
    );
    return;
  });

const isDownloadNecessary = (
  thisLocalPath: string,
  stats: fs.Stats,
  remote: files.FileMetadata
): Promise<boolean | "set_mtime"> => {
  // We know that they both exist, and are files
  if (stats.size !== remote.size) return Promise.resolve(true);

  return contentHash(
    fs.createReadStream(thisLocalPath, { autoClose: true })
  ).then((hash) => {
    if (hash !== remote.content_hash) return true;

    if (formatTime(stats.mtime) !== remote.client_modified) {
      return "set_mtime";
    }

    return false;
  });
};

const syncActionHandler = (
  dbx: Dropbox,
  _dropboxPath: string,
  localPath: string,
  dryRun: boolean,
  withDelete: boolean,
  action: engine.Action,
  mkdirPromiseMap: Map<string, Promise<void>>
): Promise<void> => {
  if (action.remote) {
    const thisLocalPath = localPath + action.remote.relativePath;
    const remotePathDisplay = action.remote.metadata.path_display;

    if (action.tag === "file") {
      const metadata = action.remote.metadata;

      if (action.local) {
        return conditionalDownload(
          dbx,
          thisLocalPath,
          action.local.stat,
          metadata,
          dryRun
        );
      } else {
        return mkdir
          .mkdir(path.dirname(thisLocalPath), dryRun, mkdirPromiseMap)
          .then(() =>
            unconditionalDownload(dbx, thisLocalPath, metadata, dryRun)
          );
      }
    } else {
      if (action.local) {
        // Local exists, so it must already be a directory.
        // We *could* ensure that the local directory's case is correct
        // (e.g. rename directory foo to Foo).
        console.log(
          `already got directory [${thisLocalPath}] (${action.local.path}) for ${remotePathDisplay}`
        );
      } else {
        return mkdir.mkdir(thisLocalPath, dryRun, mkdirPromiseMap);
      }
    }
  } else if (action.local && withDelete) {
    return doDelete(action.local, dryRun);
  }

  return Promise.resolve();
};

export const main = (
  dbxp: DropboxProvider,
  dropboxPath: string,
  localPath: string,
  dryRun: boolean,
  withDelete: boolean
): Promise<boolean> =>
  engine
    .calculate(dbxp, dropboxPath, localPath)
    .then(({ syncActions, dbx }) => {
      if (engine.showErrorsAndWarnings(syncActions).hasErrors) {
        return false;
      }

      const mkdirPromiseMap = mkdir.makeMap();

      for (const syncAction of syncActions) {
        const local = syncAction.action?.local;
        if (local) {
          if (local.stat.isDirectory()) mkdir.seed(local.path, mkdirPromiseMap);
        }
      }

      return Promise.all(
        syncActions.map((syncAction) =>
          syncAction.action
            ? syncActionHandler(
                dbx,
                dropboxPath,
                localPath,
                dryRun,
                withDelete,
                syncAction.action,
                mkdirPromiseMap
              )
            : Promise.resolve()
        )
      ).then(() => true);
    });
