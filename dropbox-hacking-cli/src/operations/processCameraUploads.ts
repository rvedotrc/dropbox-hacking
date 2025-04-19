import { files, type DropboxResponseError } from "dropbox";

import { Handler } from "../types.js";
import path from "node:path";
import { lister } from "dropbox-hacking-lister";
import { Mover } from "dropbox-hacking-mover";
import {
  DropboxProvider,
  GlobalOptions,
  processOptions,
} from "dropbox-hacking-util";

const verb = "process-camera-uploads";
const CAMERA_UPLOADS = "/Camera Uploads";

const TIDY = "--tidy";
const TAIL = "--tail";
const DRY_RUN = "--dry-run";

const targetForRemoteFile = (item: files.FileMetadata): string | undefined => {
  if (item.path_display === undefined) return undefined;
  if (item.path_lower === undefined) return undefined;
  if (item.content_hash === undefined) return undefined;

  return targetForFile(item.name, item.content_hash, item.client_modified);
};

const picsExts = new Set([".jpg", ".png", ".heic", ".dng", ".cr3"]);
const videosExts = new Set([".mov", ".mp4", ".srt"]);

type WithPath = { path_lower: string; path_display: string };
const hasPath = <T extends { path_lower?: string; path_display?: string }>(
  item: T,
): item is T & WithPath => !!item.path_lower && !!item.path_display;

// type FileMetadataWithPath = FileMetadata & { path_lower: string; path_display: string };
// type FolderMetadataWithPath = FolderMetadata & { path_lower: string; path_display: string };
// const fileHasPath = (item: FileMetadata): item is FileMetadataWithPath => !!item.path_lower && !!item.path_display;
// const folderHasPath = (item: FolderMetadata): item is FileMetadataWithPath => !!item.path_lower && !!item.path_display;

export const targetForFile = (
  basename: string,
  contentHash: string,
  clientModified: string,
): string | undefined => {
  const yyyy = clientModified.substring(0, 4);
  const yyyymm = clientModified.substring(0, 7);
  const yyyymmdd = clientModified.substring(0, 10);

  const ext = path.extname(basename);

  let nameWithHash = basename;
  if (!nameWithHash.toLowerCase().endsWith(`.${contentHash}${ext}`)) {
    nameWithHash = `${path.basename(basename, ext)}.${contentHash}${ext}`;
  }

  if (picsExts.has(ext.toLowerCase())) {
    return `/pics/camera/sliced/${yyyy}/${yyyymm}/${yyyymmdd}/${nameWithHash}`;
  }

  if (videosExts.has(ext.toLowerCase())) {
    return `/pics/videos/sliced/${yyyy}/${yyyymm}/${yyyymmdd}/${nameWithHash}`;
  }

  return undefined;
};

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  let tidy = false;
  let tail = false;
  let dryRun = false;

  argv = processOptions(argv, {
    [TIDY]: () => (tidy = true),
    [TAIL]: () => (tail = true),
    [DRY_RUN]: () => (dryRun = true),
  });

  if (argv.length > 1) usageFail();

  const localPath = argv[0] || CAMERA_UPLOADS;

  const dbx = await dbxp();

  const mover = new Mover(dbx, globalOptions);

  const tryMove = async (
    item: files.FileMetadata,
    wantedPath: string,
  ): Promise<void> => {
    if (!item.path_display) return;

    const existing = await dbx.filesGetMetadata({ path: wantedPath }).then(
      (r) => r.result,
      (err: DropboxResponseError<{ error: files.GetMetadataError }>) => {
        if (
          err.status === 409 &&
          err.error.error[".tag"] === "path" &&
          err.error.error.path[".tag"] === "not_found"
        ) {
          return undefined;
        }

        console.log(JSON.stringify({ get_existing: err }));
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw err;
      },
    );

    // console.log(` == ${JSON.stringify(existing)}`);

    if (existing === undefined) {
      console.log(`  want: ${item.path_display} -> ${wantedPath}`);

      if (!dryRun) {
        return mover
          .submit({
            from_path: item.path_display,
            to_path: wantedPath,
          })
          .then(() => {
            console.log(`  done: ${item.path_display} -> ${wantedPath}`);
          });
      }
    } else {
      console.log(`  declining to move because the target exists:`);
      console.log(`  ${JSON.stringify(existing)}`);

      if (existing[".tag"] === "file") {
        if (existing.content_hash === item.content_hash) {
          if (existing.client_modified === item.client_modified) {
            console.log(`  identical - will remove source`);
            if (!dryRun) {
              shutdownWaitsFor(
                dbx.filesDeleteV2({ path: item.id }).catch(() => undefined),
              );
            }
          } else {
            console.log(`  mismatching mtimes`);
          }
        } else {
          console.log(`  different content`);
        }
      } else {
        console.log(`  file/dir mismatch`);
      }
    }
  };

  let shutdownPromise = Promise.resolve();
  const shutdownWaitsFor = (p: Promise<unknown>): void => {
    shutdownPromise = Promise.all([
      shutdownPromise,
      p.catch(() => undefined),
    ]).then(() => undefined);
  };

  if (tidy) {
    const fileItems: (files.FileMetadata & WithPath)[] = [];
    const folderItems: (files.FolderMetadata & WithPath)[] = [];

    await lister({
      dbx,
      listing: {
        tag: "from_start",
        args: { path: localPath, recursive: true },
        tail: false,
      },
      onItem: (item) => {
        if (item[".tag"] === "file" && hasPath(item)) fileItems.push(item);
        if (item[".tag"] === "folder" && hasPath(item)) folderItems.push(item);
        return Promise.resolve();
      },
      globalOptions,
    }).promise;

    const paths = new Set<string>();
    fileItems.forEach((item) => paths.add(item.path_lower));
    folderItems.forEach((item) => paths.add(item.path_lower));

    const shouldDeleteFile = (file: files.FileMetadata & WithPath): boolean =>
      file.path_lower.endsWith(".ctg") ||
      file.name.toLowerCase() === "fseventsd-uuid" ||
      file.name.toLowerCase() === ".trashes";

    await Promise.all(
      fileItems
        .filter(shouldDeleteFile)
        .map((item) =>
          dbx
            .filesDeleteV2({ path: item.path_lower })
            .then(() => paths.delete(item.path_lower)),
        ),
    );

    console.log([...paths.values()].sort().join("\n"));

    folderItems.sort((a, b) => a.path_lower.localeCompare(b.path_lower));
    folderItems.shift(); // The Camera Uploads folder itself

    const hasChild = (parentPath: string): boolean => {
      for (const childPath of paths) {
        if (childPath.startsWith(parentPath + "/")) return true;
      }

      return false;
    };

    for (const item of [...folderItems].reverse()) {
      if (!hasChild(item.path_lower)) {
        console.log(`rmdir ${item.path_lower}`);
        await dbx.filesDeleteV2({ path: item.path_lower });
        paths.delete(item.path_lower);
      }
    }
  } else {
    await lister({
      dbx,
      listing: {
        tag: "from_start",
        args: { path: localPath, recursive: true },
        tail,
      },
      onItem: async (item) => {
        // console.log("Got item from lister:", JSON.stringify(item));

        if (item[".tag"] === "file" && item.path_lower && item.path_display) {
          const wantedPath = targetForRemoteFile(item);
          // console.log({ item, wantedPath });
          if (wantedPath && wantedPath.toLowerCase() !== item.path_lower)
            return shutdownWaitsFor(tryMove(item, wantedPath));
          else if (!wantedPath) {
            console.warn(`No 'wanted' path for ${item.path_display}`);
          }
        }

        return Promise.resolve();
      },
      // onCursor: async (cursor) => {
      //   console.log({ cursor });
      // },
      onPause: async () => {
        console.log("pause");
      },
      onResume: async () => console.log("resume"),
      globalOptions,
    }).promise;
  }

  await shutdownPromise;
  process.exit(0);
};

const argsHelp = `[${TIDY}] [${TAIL}] [${DRY_RUN}] [PATH]`;

export default { verb, handler, argsHelp };
