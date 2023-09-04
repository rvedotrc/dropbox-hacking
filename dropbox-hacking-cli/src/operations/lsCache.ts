import { DropboxProvider, Handler } from "../types";
import { StateDir } from "dropbox-hacking-ls-cache";
import { Dropbox } from "dropbox";
import { GlobalOptions, writeStderr, writeStdout } from "dropbox-hacking-util";
import { processOptions } from "dropbox-hacking-util/dist/global-options/options";
import { ListerArgs, default as lister } from "dropbox-hacking-lister";

const verb = "ls-cache";

const subInit = "init";
const subUpdate = "update";
const subShow = "show";
const RECURSIVE = "--recursive";
const TAIL = "--tail";

const makeLister = (
  dbx: Dropbox,
  listerArgs: ListerArgs,
  stateDir: StateDir,
  globalOptions: GlobalOptions,
) =>
  lister({
    dbx,
    listing: listerArgs,
    onItem: (item) => stateDir.addItem(item),
    onCursor: (cursor) => stateDir.setCursor(cursor),
    onPause: () => stateDir.setReady(),
    globalOptions,
  });

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

  if (argv.length !== 2) return usageFail();

  const dropboxPath = argv[0];
  const statePath = argv[1];

  const stateDir = new StateDir(statePath);
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

  if (argv.length !== 1) return usageFail();

  const statePath = argv[0];

  const stateDir = new StateDir(statePath);
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
  await stateDir.flush();
};

const showHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subShow} STATE_DIR`
  if (argv.length !== 1) return usageFail();

  const statePath = argv[0];

  const stateDir = new StateDir(statePath);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag !== "ready") {
    return writeStderr(
      "Error: no listing available - use 'update' first\n",
    ).then(() => process.exit(1));
  }

  const payload = {
    ...state,
    entries: [...state.entries.values()],
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
  `${subInit} [${RECURSIVE}] [${TAIL}] DROPBOX_PATH STATE_DIR`,
  `${subUpdate} [${TAIL}] STATE_DIR`,
  `${subShow} STATE_DIR`,
];

export default { verb, handler, argsHelp };
