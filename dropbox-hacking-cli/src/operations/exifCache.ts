import { Handler } from "../types";
import { lister, ListerArgs } from "dropbox-hacking-lister";
import {
  ExifDB,
  StateDir,
  fetcher as Fetcher,
  Fetcher as F,
} from "dropbox-hacking-exif-db";
import { Dropbox, files } from "dropbox";
import { ExifParserFactory } from "ts-exif-parser";
import FileMetadata = files.FileMetadata;
import {
  DropboxProvider,
  GlobalOptions,
  makePromiseLimiter,
  processOptions,
  writeStderr,
  writeStdout,
} from "dropbox-hacking-util";

const verb = "exif-cache";

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

const doItem = async (
  dbx: Dropbox,
  item: FileMetadata,
  stateDir: StateDir,
  fetcher: F,
): Promise<void> => {
  if (item.content_hash === undefined) return;
  if (item.path_lower === undefined) return;
  if (item.path_display === undefined) return;
  if (!item.path_lower.endsWith(".jpg")) return;

  if (stateDir.hasContentHash(item.content_hash)) return;

  const contentHash = item.content_hash;
  const pathDisplay = item.path_display;

  pendingItems.push(
    fetcher
      .fetch(item)
      .then((buffer) => ExifParserFactory.create(buffer).parse())
      .then((exifData) => stateDir.addFile(contentHash, exifData, pathDisplay)),
  );
};

const makeLister = (
  dbx: Dropbox,
  listerArgs: ListerArgs,
  stateDir: StateDir,
  globalOptions: GlobalOptions,
) => {
  const limiter = makePromiseLimiter<Buffer>(5, "exif-cache-limiter");
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
  const exifPath = argv[2];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
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
  const exifPath = argv[1];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
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
  const exifPath = argv[1];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag !== "ready") {
    return writeStderr(
      "Error: no listing available - use 'update' first\n",
    ).then(() => process.exit(1));
  }

  const payload = {
    ...state,
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
  `${subInit} [${RECURSIVE}] [${TAIL}] DROPBOX_PATH STATE_DIR EXIF_DIR`,
  `${subUpdate} [${TAIL}] STATE_DIR EXIF_DIR`,
  `${subShow} STATE_DIR EXIF_DIR`,
];

export default { verb, handler, argsHelp };
