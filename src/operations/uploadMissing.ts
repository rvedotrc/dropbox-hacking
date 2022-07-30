import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import { StateDir } from "../components/lsCache";
import localListing, { Item } from "../components/sync/local-listing";
import makeContentHash from "../components/uploader/make-content-hash";
import * as fs from "fs";
import { makePromiseLimiter } from "../util/promises/promiseLimiter";
import { selectUploader } from "../components/uploader";
import { formatTime } from "../util/time";
import { files } from "dropbox";
import path = require("node:path");
import { targetForFile } from "./processCameraUploads";

const verb = "upload-missing";

const DRY_RUN = "--dry-run";
const DELETE = "--delete";

const cannotUpload = new Set([".DS_Store"]);

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let dryRun = false;
  let withDelete = false;

  argv = processOptions(argv, {
    [DRY_RUN]: () => (dryRun = true),
    [DELETE]: () => (withDelete = true),
  });

  if (argv.length < 3) usageFail();

  const [lsCachePath, targetDir, ...sources] = argv;

  const lsCache = new StateDir(lsCachePath);
  const seenContentHashes = await lsCache
    .load()
    .then(() => lsCache.getState())
    .then((state) => {
      if (state.tag !== "ready") throw `Bad ls cache state ${state.tag}`;

      const seen = new Map<string, string>();
      for (const e of state.entries.values()) {
        if (e[".tag"] === "file" && e.path_display && e.content_hash)
          seen.set(e.content_hash, e.path_display);
      }
      return seen;
    });

  const dbx = await dbxp();

  const contentHashLimiter = makePromiseLimiter<string>(5);
  const uploadLimiter = makePromiseLimiter<void>(5);

  const maybeDelete = (localItem: Item): Promise<void> => {
    if (!withDelete) return Promise.resolve();

    return fs.promises.unlink(localItem.path).then(() =>
      console.log(
        JSON.stringify({
          code: "deleted",
          local: localItem.path,
        })
      )
    );
  };

  await Promise.all(
    sources.map((source) =>
      localListing(source, true).then((localItems) =>
        Promise.all(
          localItems.map((localItem) => {
            if (localItem.tag !== "file") return Promise.resolve();

            return contentHashLimiter
              .submit(() =>
                makeContentHash(
                  fs.createReadStream(localItem.path, { autoClose: true })
                )
              )
              .then((localContentHash) => {
                const alreadyAtRemotePath =
                  seenContentHashes.get(localContentHash);

                if (alreadyAtRemotePath) {
                  console.log(
                    JSON.stringify({
                      code: "already_got_it",
                      local: localItem.path,
                      contentHash: localContentHash,
                      remote: alreadyAtRemotePath,
                    })
                  );

                  return maybeDelete(localItem);
                } else if (cannotUpload.has(path.basename(localItem.path))) {
                  console.log(
                    JSON.stringify({
                      code: "cannot_upload_this_filename",
                      local: localItem.path,
                      contentHash: localContentHash,
                    })
                  );

                  return Promise.resolve();
                } else {
                  // const ext = path.extname(localItem.path);

                  // let uploadTo: string;
                  //
                  // if (extensionsToHash.has(ext.toLowerCase())) {
                  //   uploadTo = `${targetDir}/${path.basename(
                  //     localItem.path,
                  //     ext
                  //   )}.${localContentHash}${ext}`;
                  // } else {
                  //   uploadTo = `${targetDir}/${path.basename(localItem.path)}`;
                  // }

                  const clientModified = formatTime(localItem.stat.mtime);
                  const uploadTo =
                    targetForFile(
                      path.basename(localItem.path),
                      localContentHash,
                      clientModified
                    ) || `${targetDir}/${path.basename(localItem.path)}`;

                  const commitInfo: files.CommitInfo = {
                    path: uploadTo,
                    client_modified: clientModified,
                    mode: { ".tag": "overwrite" },
                  };

                  if (dryRun) {
                    console.log(
                      JSON.stringify({
                        code: "need_to_upload",
                        local: localItem.path,
                        contentHash: localContentHash,
                        remote: uploadTo,
                      })
                    );

                    return Promise.resolve();
                  } else {
                    return uploadLimiter.submit(() => {
                      const readable = fs.createReadStream(localItem.path);
                      return selectUploader(localItem.stat.size)(
                        dbx,
                        commitInfo,
                        readable,
                        globalOptions
                      )
                        .finally(() => readable.close())
                        .then((remoteMetadata) => {
                          console.log(
                            JSON.stringify({
                              code: "uploaded",
                              local: localItem.path,
                              contentHash: localContentHash,
                              remote: uploadTo,
                              remoteMetadata,
                            })
                          );

                          return maybeDelete(localItem);
                        });
                    });
                  }
                }
              });
          })
        )
      )
    )
  );

  process.exit(0);
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] LSCACHE_PATH TARGET_DIR SOURCE [SOURCE ...]`;

export default { verb, handler, argsHelp };
