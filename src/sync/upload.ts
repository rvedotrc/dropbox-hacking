import * as fs from "fs";
import { Dropbox, files } from "dropbox";
import { formatTime } from "../util";
import contentHash from "../uploader/content-hash";
import * as engine from "./engine";
import { DropboxProvider } from "../types";
import * as uploader from "../uploader";
import { FileItem } from "./local-listing";

const mkdir = (
  dbx: Dropbox,
  remotePath: string,
  dryRun: boolean
): Promise<void> => {
  console.debug(`mkdir ${remotePath}`);
  if (dryRun) return Promise.resolve();

  return dbx.filesCreateFolderV2({ path: remotePath }).then(() => undefined);
};

const doUpload = (
  dbx: Dropbox,
  local: FileItem,
  remotePath: string,
  dryRun: boolean
): Promise<void> => {
  console.debug(`doUpload from ${local.path} to ${remotePath}`);
  if (dryRun) return Promise.resolve();

  const readable = fs.createReadStream(local.path);
  const commitInfo: files.CommitInfo = {
    path: remotePath,
    client_modified: formatTime(local.stat.mtime),
    mode: { ".tag": "overwrite" },
  };

  return uploader
    .selectUploader(local.stat.size)(dbx, commitInfo, readable)
    .then(() => undefined)
    .finally(() => readable.close());
};

const unconditionalUpload = (
  dbx: Dropbox,
  local: FileItem,
  remotePath: string,
  dryRun: boolean
): Promise<void> => {
  console.log(`unconditional upload from [${local.path}] to ${remotePath}`);

  return doUpload(dbx, local, remotePath, dryRun);
};

const conditionalUpload = (
  dbx: Dropbox,
  local: FileItem,
  remote: files.FileMetadata,
  dryRun: boolean
): Promise<void> =>
  isUploadNecessary(local.path, local.stat, remote).then((truth) => {
    console.log(
      `conditional upload from [${local.path}] to ${remote.path_display} => ${truth}`
    );

    if (truth == "set_mtime") {
      // TODO, do we have a way of doing this, apart from just re-uploading?
      return Promise.resolve();
    }

    if (truth) return doUpload(dbx, local, remote.id, dryRun);

    console.debug(
      `no need to upload from [${local.path}] to ${remote.path_display}`
    );
    return;
  });

const isUploadNecessary = (
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
  dropboxPath: string,
  _localPath: string,
  dryRun: boolean,
  withDelete: boolean,
  action: engine.Action
): Promise<void> => {
  if (action.local) {
    const thisRemotePath = dropboxPath + action.local.relativePath;
    const thisLocalPath = action.local.path;

    if (action.tag === "file") {
      if (action.remote) {
        return conditionalUpload(
          dbx,
          action.local,
          action.remote.metadata,
          dryRun
        );
      } else {
        return unconditionalUpload(dbx, action.local, thisRemotePath, dryRun);
      }
    } else {
      if (action.remote) {
        // Remote exists, so it must already be a directory.
        // We *could* ensure that the local directory's case is correct
        // (e.g. rename directory foo to Foo).
        console.log(
          `already got directory [${action.remote.metadata.path_display}] for ${thisLocalPath}`
        );
      } else {
        return mkdir(dbx, thisRemotePath, dryRun);
      }
    }
  } else if (action.remote && withDelete) {
    const path = action.remote.metadata.path_display;
    console.log(`delete ${path}`);
    if (!dryRun) {
      // FIXME: catch the not-found case
      return dbx
        .filesDeleteV2({ path: action.remote.metadata.id })
        .then(() => undefined);
    }
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

      return Promise.all(
        syncActions.map((syncAction) =>
          syncAction.action
            ? syncActionHandler(
                dbx,
                dropboxPath,
                localPath,
                dryRun,
                withDelete,
                syncAction.action
              )
            : Promise.resolve()
        )
      ).then(() => true);
    });
