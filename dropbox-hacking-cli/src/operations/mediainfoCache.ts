import { Handler } from "../types";
import { lister, ListerArgs } from "dropbox-hacking-lister";
import {
  MediainfoDB,
  MediainfoData,
  MediainfoFromHash,
  StateDir,
  fetcher as Fetcher,
  Fetcher as F,
} from "dropbox-hacking-mediainfo-db";
import { Dropbox, files } from "dropbox";
import FileMetadata = files.FileMetadata;
import {
  DropboxProvider,
  GlobalOptions,
  makePromiseLimiter,
  processOptions,
  writeStderr,
  writeStdout,
} from "dropbox-hacking-util";

const verb = "mediainfo-cache";

const subInit = "init";
const subUpdate = "update";
const subShow = "show";
const RECURSIVE = "--recursive";
const TAIL = "--tail";

let pendingItems: Promise<void>[] = [];

const flush = () =>
  Promise.all(pendingItems).then(() => {
    pendingItems = [];
  });

export const isMediainfoableFile = (path: string): boolean => {
  const lower = path.toLowerCase();
  return lower.endsWith(".mov") || lower.endsWith(".mp4");
};

const doItem = async (
  dbx: Dropbox,
  item: FileMetadata,
  stateDir: StateDir,
  fetcher: F,
): Promise<void> => {
  if (item.content_hash === undefined) return;
  if (item.path_lower === undefined) return;
  if (item.path_display === undefined) return;
  if (!isMediainfoableFile(item.path_lower)) return;

  if (stateDir.hasContentHash(item.content_hash)) return;

  const contentHash = item.content_hash;
  const pathDisplay = item.path_display;

  const t0 = new Date();
  console.log(`Running mediainfo for ${item.size} bytes ${item.path_display}`);

  pendingItems.push(
    fetcher
      .fetch(item)
      .then((mediainfoData) =>
        stateDir.addFile(contentHash, mediainfoData, pathDisplay),
      )
      .finally(() => {
        const t1 = new Date();
        console.log(
          `Took ${t1.getTime() - t0.getTime()}ms to get mediainfo from ${
            item.size
          } bytes ${item.path_display}`,
        );
      }),
  );
};

const makeLister = (
  dbx: Dropbox,
  listerArgs: ListerArgs,
  stateDir: StateDir,
  globalOptions: GlobalOptions,
) => {
  const limiter = makePromiseLimiter<MediainfoData>(
    5,
    "mediainfo-cache-limiter",
  );
  const fetcher = Fetcher(dbx, limiter, globalOptions);

  return lister({
    dbx,
    listing: listerArgs,
    onItem: async (item) => {
      if (item[".tag"] === "file") await doItem(dbx, item, stateDir, fetcher);
    },
    onCursor: (cursor) =>
      stateDir
        .setCursor(cursor)
        .then(() => flush())
        .then(() => stateDir.flush()),
    onPause: () => flush().then(() => stateDir.setReady()),
    globalOptions,
  });
};

const initHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subInit} [${RECURSIVE}] ${TAIL}] DROPBOX_PATH STATE_DIR`
  let recursive = false;
  let tail = false;

  argv = processOptions(argv, {
    [RECURSIVE]: () => (recursive = true),
    [TAIL]: () => (tail = true),
  });

  if (argv.length !== 3) return usageFail();

  const dropboxPath = argv[0];
  const statePath = argv[1];
  const mediainfoPath = argv[2];

  const mediainfoDb = new MediainfoDB(mediainfoPath);
  const stateDir = new StateDir(statePath, mediainfoDb);
  await stateDir.initialize(dropboxPath, recursive);

  const dbx = await dbxp();

  const r = makeLister(
    dbx,
    {
      tag: "from_start",
      args: {
        path: dropboxPath,
        recursive,
      },
      tail,
    },
    stateDir,
    globalOptions,
  );

  await r.promise;
  await flush();
  await stateDir.setReady();
};

const updateHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subUpdate} [${TAIL}] STATE_DIR`
  let tail = false;

  argv = processOptions(argv, {
    [TAIL]: () => (tail = true),
  });

  if (argv.length !== 2) return usageFail();

  const statePath = argv[0];
  const mediainfoPath = argv[1];

  const mediainfoDb = new MediainfoDB(mediainfoPath);
  const stateDir = new StateDir(statePath, mediainfoDb);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag === "does_not_exist") {
    await writeStderr(`Error: no existing state, use '${subInit}' first\n`);
    await usageFail();
    process.exit(1);
  }

  const dbx = await dbxp();
  const startCursor = state.cursor;

  const r = makeLister(
    dbx,
    {
      tag: "cursor",
      args: {
        cursor: startCursor,
      },
      tail,
    },
    stateDir,
    globalOptions,
  );

  await r.promise;
  await flush();
  await stateDir.flush();
};

const showHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subShow} STATE_DIR`
  if (argv.length !== 2) return usageFail();

  const statePath = argv[0];
  const mediainfoPath = argv[1];

  const mediainfoDb = new MediainfoDB(mediainfoPath);
  const stateDir = new StateDir(statePath, mediainfoDb);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag !== "ready") {
    return writeStderr(
      "Error: no listing available - use 'update' first\n",
    ).then(() => process.exit(1));
  }

  const db = await mediainfoDb.readAll();
  const dbAsJson: Record<string, MediainfoFromHash> = {};
  for (const [k, v] of db.entries()) {
    dbAsJson[k] = v;
  }

  const payload = {
    ...state,
    db: dbAsJson,
  };

  await writeStdout(JSON.stringify(payload) + "\n");
};

const handler: Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  if (argv[0] === subInit)
    return initHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  if (argv[0] === subUpdate)
    return updateHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  if (argv[0] === subShow)
    return showHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  return usageFail();
};

const argsHelp = [
  `${subInit} [${RECURSIVE}] [${TAIL}] DROPBOX_PATH STATE_DIR MEDIAINFO_DIR`,
  `${subUpdate} [${TAIL}] STATE_DIR MEDIAINFO_DIR`,
  `${subShow} STATE_DIR MEDIAINFO_DIR`,
];

export default { verb, handler, argsHelp };
