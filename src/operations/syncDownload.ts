import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import * as engine from "../sync/engine";
import * as path from "path";
import * as fs from "fs";
import { Dropbox, files } from "dropbox";
import contentHash from "../uploader/content-hash";
import { formatTime, parseTime } from "../util";

const verb = "sync-download";

// Does a "mkdir -p" on the destination structure

const mkdir = (
  localPath: string,
  dryRun: boolean,
  mkdirPromiseMap: Map<string, Promise<void>>
): Promise<void> => {
  let promise = mkdirPromiseMap.get(localPath);
  if (promise) return promise;

  const parentPath = path.dirname(localPath);
  const parentPromise =
    parentPath !== localPath
      ? mkdir(parentPath, dryRun, mkdirPromiseMap)
      : Promise.resolve();

  promise = parentPromise.then(() => {
    console.log(`mkdir [${localPath}]`);
    if (!dryRun)
      return fs.promises.mkdir(localPath).catch((err) => {
        if (err.code === "EEXIST" || err.code === "EISDIR") return;
        throw err;
      });
    return;
  });

  mkdirPromiseMap.set(localPath, promise);

  return promise;
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
  _dbx: Dropbox,
  thisLocalPath: string,
  remote: files.FileMetadata,
  dryRun: boolean
): Promise<void> => {
  if (dryRun) return Promise.resolve();

  console.log("TODO");
  return Promise.resolve();
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

    return truth
      ? doDownload(dbx, thisLocalPath, remote, dryRun)
      : Promise.resolve();
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
  args: Parameters<engine.SyncActionHandler>,
  mkdirPromiseMap: Map<string, Promise<void>>
): Promise<void> => {
  const [dbx, _dropboxPath, localPath, dryRun, action] = args;

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
        return mkdir(path.dirname(thisLocalPath), dryRun, mkdirPromiseMap).then(
          () => unconditionalDownload(dbx, thisLocalPath, metadata, dryRun)
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
        return mkdir(thisLocalPath, dryRun, mkdirPromiseMap);
      }
    }
  }

  return Promise.resolve();
};

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  let dryRun = false;
  if (argv[0] === "--dry-run") {
    dryRun = true;
    argv.shift();
  }

  if (argv.length !== 2) usageFail(verb);

  const dropboxPath = argv[0];
  const localPath = argv[1];

  const mkdirPromiseMap = new Map<string, Promise<void>>();
  const wrapped: engine.SyncActionHandler = (
    ...args: Parameters<engine.SyncActionHandler>
  ): ReturnType<engine.SyncActionHandler> =>
    syncActionHandler(args, mkdirPromiseMap);

  return engine
    .run(dbxp, dropboxPath, localPath, dryRun, wrapped)
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = "DROPBOX_PATH LOCAL_PATH";

export default { verb, handler, argsHelp };
