import { files } from "dropbox";
import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import { writeStderr, writeStdout } from "../util";
import lister from "../lister";
import * as fs from "fs";

const verb = "ls-cache";

const subInit = "init";
const subUpdate = "update";
const subShow = "show";
const RECURSIVE = "--recursive";
const TAIL = "--tail";

type NonDeletedEntries = (
  | files.FileMetadataReference
  | files.FolderMetadataReference
)[];

type State =
  | { tag: "does_not_exist" }
  | { tag: "starting"; cursor: string }
  | {
      tag: "ready";
      entries: NonDeletedEntries;
      cursor: string;
      path: string;
      recursive: boolean;
      correctAsOf: Date;
    };

type Data = {
  ready: boolean;
  entries: NonDeletedEntries;
  cursor: string;
  path: string;
  recursive: boolean;
  correctAsOf: number;
};

class StateDir {
  private readonly dir: string;
  private readonly entriesFile: string;
  private data: Data | undefined;

  constructor(dir: string) {
    this.dir = dir;
    this.entriesFile = `${dir}/entries.json`;
    this.data = undefined;
  }

  public async getState(): Promise<State> {
    return this.getData().then((data) => {
      if (!data || data.correctAsOf === 0) return { tag: "does_not_exist" };

      if (!data.ready)
        return {
          tag: "starting",
          cursor: data.cursor,
        };

      return {
        tag: "ready",
        entries: data.entries,
        cursor: data.cursor,
        path: data.path,
        recursive: data.recursive,
        correctAsOf: new Date(data.correctAsOf),
      };
    });
  }

  public initialize(path: string, recursive: boolean): Promise<void> {
    console.debug("initialize");

    return fs.promises
      .mkdir(this.dir)
      .catch((err) => {
        if (err.code === "EEXIST") return;
        throw err;
      })
      .then(() =>
        this.setData({
          ready: false,
          entries: [],
          path,
          recursive,
          cursor: "",
          correctAsOf: 0,
        })
      );
  }

  public addItem(item: files.ListFolderResult["entries"][0]): Promise<void> {
    console.debug(`addItem ${item[".tag"]} ${item.path_lower}`);

    if (!this.data) throw "No data";
    let entries = this.data.entries;

    // Naive approach for now. Will not scale well.
    // - keeps all entries in memory
    // - reserialises and writes on every single item

    if (item[".tag"] == "deleted") {
      entries = entries.filter(
        (e) =>
          e.path_lower !== item.path_lower &&
          !e.path_lower?.startsWith(item.path_lower + "/")
      );
    } else {
      entries = [...entries];

      const index = entries.findIndex((e) => e.path_lower === item.path_lower);
      if (index >= 0) entries.splice(index, 1);

      entries.push(item);
    }

    return this.setData({ ...this.data, entries });
  }

  public setCursor(cursor: string): Promise<void> {
    console.debug(`setCursor ${cursor}`);
    if (!this.data) throw "No data";
    return this.setData({ ...this.data, cursor });
  }

  public setReady(): Promise<void> {
    console.debug("setReady");
    if (!this.data) throw "No data";
    return this.setData({
      ...this.data,
      ready: true,
      correctAsOf: new Date().getTime(),
    });
  }

  private getData(): Promise<Data | undefined> {
    return fs.promises
      .readFile(this.entriesFile, { encoding: "utf-8" })
      .then(
        (contents) => JSON.parse(contents) as Data,
        (err) => {
          if (err.code === "ENOENT") return undefined;
          throw err;
        }
      )
      .then((data) => (this.data = data));
  }

  private setData(data: Data): Promise<void> {
    const tmpFile = this.entriesFile + ".tmp";
    console.debug(`setData with ${data.entries.length} entries`);
    return fs.promises
      .writeFile(tmpFile, JSON.stringify(data) + "\n", {
        encoding: "utf-8",
        mode: 0o600,
      })
      .then(() => fs.promises.rename(tmpFile, this.entriesFile))
      .then(() => (this.data = data))
      .then(() => undefined);
  }
}

const initHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>
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
  const stateDir = new StateDir(argv[1]);

  await stateDir.initialize(dropboxPath, recursive);

  const dbx = await dbxp();

  const r = lister({
    dbx,
    listing: {
      tag: "path",
      path: dropboxPath,
      recursive,
      latest: false,
      tail,
    },
    onItem: (item) => stateDir.addItem(item),
    onCursor: (cursor) => stateDir.setCursor(cursor),
    onPause: () => stateDir.setReady(),
  });

  await r.promise;
};

const updateHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>
): Promise<void> => {
  // `${subUpdate} [${TAIL}] STATE_DIR`
  let tail = false;

  argv = processOptions(argv, {
    [TAIL]: () => (tail = true),
  });

  if (argv.length !== 1) return usageFail();

  const stateDir = new StateDir(argv[0]);

  const state = await stateDir.getState();
  if (state.tag === "does_not_exist") {
    await writeStderr(`Error: no existing state, use '${subInit}' first\n`);
    await usageFail();
    process.exit(1);
  }

  const dbx = await dbxp();
  const startCursor = state.cursor;

  const r = lister({
    dbx,
    listing: {
      tag: "cursor",
      cursor: startCursor,
      tail,
    },
    onItem: (item) => stateDir.addItem(item),
    onCursor: (cursor) => stateDir.setCursor(cursor),
    onPause: () => stateDir.setReady(),
  });

  await r.promise;
};

const showHandler: Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>
): Promise<void> => {
  // `${subShow} STATE_DIR`
  if (argv.length !== 1) return usageFail();

  const stateDir = new StateDir(argv[0]);

  return stateDir.getState().then(async (state) => {
    if (state.tag !== "ready") {
      return writeStderr(
        "Error: no listing available - use 'update' first\n"
      ).then(() => process.exit(1));
    }

    await writeStdout(JSON.stringify(state) + "\n");
  });
};

const handler: Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>
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
