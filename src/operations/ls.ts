import { files } from "dropbox";
import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import { writeStderr, writeStdout } from "../util/logging";
import lister from "../components/lister";

type FolderStats = {
  childFileCount: number;
  childFileBytes: number;
  childFolderCount: number;
  descendantFileCount: number;
  descendantFileBytes: number;
  descendantFolderCount: number;
};

const zeroStats = (): FolderStats => ({
  childFileCount: 0,
  childFileBytes: 0,
  childFolderCount: 0,
  descendantFileCount: 0,
  descendantFileBytes: 0,
  descendantFolderCount: 0,
});

const verb = "ls";

const RECURSIVE = "--recursive";
const TAIL = "--tail";
const LATEST = "--latest";
const PER_DIRECTORY_TOTALS = "--per-directory-totals";
const TOTALS = "--totals";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let recursive = false;
  let tail = false;
  let latest = false;
  let showPerDirectoryTotals = false;
  let showTotals = false;

  argv = processOptions(argv, {
    [RECURSIVE]: () => (recursive = true),
    [TAIL]: () => (tail = true),
    [LATEST]: () => (latest = true),
    [PER_DIRECTORY_TOTALS]: () => (showPerDirectoryTotals = true),
    [TOTALS]: () => (showTotals = true),
  });

  if (latest && !tail) {
    process.stderr.write(`${LATEST} doesn't make sense without ${TAIL}\n`);
    process.exit(1);
  }

  // But maybe we could.  Continuously updating stats? Hmmm.
  if ((showTotals || showPerDirectoryTotals) && tail) {
    await writeStderr(
      `${TOTALS} / ${PER_DIRECTORY_TOTALS} can't be used with ${TAIL}\n`
    );
    process.exit(1);
  }

  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const dbx = await dbxp();

  const totals = new Map<string, FolderStats>();

  const statsForFolder = (folderPath: string): FolderStats => {
    let stats = totals.get(folderPath);
    if (stats) return stats;

    stats = zeroStats();
    totals.set(folderPath, stats);
    return stats;
  };

  const parentFolderOf = (objectPath: string): string =>
    objectPath.substring(0, objectPath.lastIndexOf("/"));

  const statsAddFile = (object: files.FileMetadata) => {
    if (object.path_display === undefined) return;

    let folderPath = parentFolderOf(object.path_display);
    let stats = statsForFolder(folderPath);
    ++stats.childFileCount;
    stats.childFileBytes += object.size;

    while (true) {
      ++stats.descendantFileCount;
      stats.descendantFileBytes += object.size;

      if (folderPath === "") break;

      folderPath = parentFolderOf(folderPath);
      stats = statsForFolder(folderPath);
    }
  };

  const statsAddFolder = (object: files.FolderMetadata) => {
    if (object.path_display === undefined) return;

    // ensure exists, even if all zero
    statsForFolder(object.path_display);

    let folderPath = parentFolderOf(object.path_display);
    let stats = statsForFolder(folderPath);
    ++stats.childFolderCount;

    while (true) {
      ++stats.descendantFolderCount;

      if (folderPath === "") break;

      folderPath = parentFolderOf(folderPath);
      stats = statsForFolder(folderPath);
    }
  };

  await lister({
    dbx,
    listing: {
      tag: latest ? "from_latest" : "from_start",
      args: {
        path,
        recursive,
      },
      tail,
    },
    onItem: async (object) => {
      if (object[".tag"] === "file") statsAddFile(object);
      if (object[".tag"] === "folder") statsAddFolder(object);
      await writeStdout(JSON.stringify(object) + "\n");
    },
    globalOptions,
  }).promise;

  if (showPerDirectoryTotals) {
    const payload: Record<string, FolderStats> = {};
    for (const key of [...totals.keys()].sort()) {
      payload[key] = statsForFolder(key);
    }
    await writeStdout(JSON.stringify({ perDirectoryTotals: payload }) + "\n");
  } else if (showTotals) {
    // console.debug("totals");
    // We can show the stats for the root folder, even if we only
    // listing a sub-folder; the stats will have been accumulated to root,
    // even though the stats do not represent the whole picture for root.
    await writeStdout(JSON.stringify({ totals: statsForFolder("") }) + "\n");
  }

  // console.debug("done");
  process.exit(0);
};

const argsHelp = `[${RECURSIVE}] [${TOTALS} | ${PER_DIRECTORY_TOTALS} | ${TAIL} [${LATEST}]] DROPBOX_PATH`;

export default { verb, handler, argsHelp };
