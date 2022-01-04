import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import lister from "../lister";
import Mover from "../mover";
import { files } from "dropbox";

const verb = "process-camera-uploads";
const CAMERA_UPLOADS = "/Camera Uploads";

const TAIL = "--tail";
const DRY_RUN = "--dry-run";

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

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let tail = false;
  let dryRun = false;

  argv = processOptions(argv, {
    [TAIL]: () => (tail = true),
    [DRY_RUN]: () => (dryRun = true),
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
      console.log(`  -> ${wantedPath}`);

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

  await lister(
    dbx,
    { path, recursive: true, tail, latest: false },
    async (item) => {
      console.log(JSON.stringify(item));

      if (item[".tag"] === "file" && item.path_lower && item.path_display) {
        const wantedPath = targetForFile(item);
        if (wantedPath && wantedPath.toLowerCase() !== item.path_lower)
          return shutdownWaitsFor(tryMove(item, wantedPath));
      }

      return Promise.resolve();
    },
    async (cursor) => console.log({ cursor }),
    async () => console.log("pause"),
    async () => console.log("resume")
  );

  await shutdownPromise;
  process.exit(0);
};

const argsHelp = `[${TAIL}] [${DRY_RUN}] [PATH]`;

export default { verb, handler, argsHelp };
