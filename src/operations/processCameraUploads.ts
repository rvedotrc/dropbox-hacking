import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import lister, { ListerArgs } from "../components/lister";
import Mover from "../components/mover";
import { files } from "dropbox";

const verb = "process-camera-uploads";
const CAMERA_UPLOADS = "/Camera Uploads";

const TAIL = "--tail";
const DRY_RUN = "--dry-run";
// const STATE_FILE = "--state-file";

const targetForFile = (item: files.FileMetadata): string | undefined => {
  if (item.path_display === undefined) return undefined;
  if (item.path_lower === undefined) return undefined;

  const yyyy = item.client_modified.substring(0, 4);
  const yyyymm = item.client_modified.substring(0, 7);
  const yyyymmdd = item.client_modified.substring(0, 10);
  const parts = item.path_display.split("/");
  const basename = parts[parts.length - 1];

  if (item.path_lower.endsWith(".jpg") || item.path_lower.endsWith(".png")) {
    return `/pics/camera/sliced/${yyyy}/${yyyymm}/${yyyymmdd}/${basename}`;
  }

  if (item.path_lower.endsWith(".mov") || item.path_lower.endsWith(".mp4")) {
    return `/pics/videos/sliced/${yyyy}/${yyyymm}/${yyyymmdd}/${basename}`;
  }

  return undefined;
};

// type State = {
//   cursor: string;
// };
//
// const loadState = (stateFile: string): Promise<State | undefined> =>
//   fs.promises
//     .readFile(stateFile, { encoding: "utf-8" })
//     .then((contents) => JSON.parse(contents))
//     .then((json: unknown) => {
//       if (json && typeof json === "object" && "cursor" in json) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const cursor = (json as any)["cursor"];
//         if (typeof cursor === "string") {
//           return { cursor };
//         }
//       }
//
//       return undefined;
//     })
//     .catch((err) => {
//       if (err.code === "ENOENT") return undefined;
//       throw err;
//     });
//
// const saveState = (stateFile: string, state: State): Promise<void> => {
//   const tmpFile = stateFile + `.tmp.${randomUUID().toString()}`;
//
//   const w = fs.createWriteStream(tmpFile, { mode: 0o600, flags: "wx" });
//
//   return new Promise((resolve, reject) =>
//     w.write(JSON.stringify(state) + "\n", "utf-8", (err) =>
//       err ? reject(err) : resolve(undefined)
//     )
//   )
//     .then(() => fs.promises.rename(tmpFile, stateFile))
//     .finally(() => w.close())
//     .finally(() => fs.unlink(tmpFile, () => {}));
// };

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let tail = false;
  let dryRun = false;
  // let stateFile: string | undefined = undefined;

  argv = processOptions(argv, {
    [TAIL]: () => (tail = true),
    [DRY_RUN]: () => (dryRun = true),
    // [STATE_FILE]: (args) => (stateFile = args.shift()),
  });

  if (argv.length > 1) usageFail();

  const path = argv[0] || CAMERA_UPLOADS;

  const dbx = await dbxp();

  const mover = new Mover(dbx, globalOptions);

  const tryMove = async (
    item: files.FileMetadata,
    wantedPath: string
  ): Promise<void> => {
    if (!item.path_display) return;

    const existing = await dbx.filesGetMetadata({ path: wantedPath }).then(
      (r) => r.result,
      (err) => {
        if (
          err.status === 409 &&
          err.error?.error_summary.includes("path/not_found")
        )
          return undefined;

        console.log(JSON.stringify({ get_existing: err }));
        throw err;
      }
    );

    // console.log(` == ${JSON.stringify(existing)}`);

    if (existing === undefined) {
      console.log(`  ${item.path_display} -> ${wantedPath}`);

      if (!dryRun) {
        return mover.submit({
          from_path: item.path_display,
          to_path: wantedPath,
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
                dbx.filesDeleteV2({ path: item.id }).catch(() => undefined)
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

  const initialCursor: string | undefined = undefined;
  // if (stateFile) {
  //   initialCursor = (await loadState(stateFile))?.cursor;
  // }

  const listerArgs: ListerArgs = initialCursor
    ? { tag: "cursor", args: { cursor: initialCursor }, tail }
    : { tag: "from_start", args: { path, recursive: true }, tail };

  await lister({
    dbx,
    listing: listerArgs,
    onItem: async (item) => {
      console.log(JSON.stringify(item));

      if (item[".tag"] === "file" && item.path_lower && item.path_display) {
        const wantedPath = targetForFile(item);
        if (wantedPath && wantedPath.toLowerCase() !== item.path_lower)
          return shutdownWaitsFor(tryMove(item, wantedPath));
      }

      return Promise.resolve();
    },
    onCursor: async (cursor) => {
      console.log({ cursor });
      // if (stateFile) await saveState(stateFile, { cursor });
    },
    onPause: async () => {
      console.log("pause");
    },
    onResume: async () => console.log("resume"),
    globalOptions,
  }).promise;

  await shutdownPromise;
  process.exit(0);
};

// const argsHelp = `[${TAIL}] [${DRY_RUN}] [${STATE_FILE} FILE] [PATH]`;
const argsHelp = `[${TAIL}] [${DRY_RUN}] [PATH]`;

export default { verb, handler, argsHelp };
