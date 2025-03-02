import { files } from "dropbox";
import * as fs from "fs";

type NonDeletedEntries = (
  | files.FileMetadataReference
  | files.FolderMetadataReference
)[];

type NonDeletedEntriesMap = Map<string, NonDeletedEntries[number]>;

export type State =
  | { tag: "does_not_exist" }
  | { tag: "starting"; cursor: string }
  | {
      tag: "ready";
      entries: NonDeletedEntriesMap;
      cursor: string;
      path: string;
      recursive: boolean;
      correctAsOf: number;
    };

type Data = {
  ready: boolean;
  entries: NonDeletedEntriesMap;
  cursor: string;
  path: string;
  recursive: boolean;
  correctAsOf: number;
};

export class StateDir {
  private readonly dir: string;
  private readonly entriesFile: string;
  private data: Data | undefined;
  private dirty: boolean;
  private lastSaved: number;

  constructor(dir: string) {
    this.dir = dir;
    this.entriesFile = `${dir}/entries.json`;
    this.data = undefined;
    this.dirty = false;
    this.lastSaved = 0;
  }

  public load(): Promise<void> {
    return this.getData().then((data) => {
      this.data = data;
      this.dirty = false;
    });
  }

  public async getState(): Promise<State> {
    return Promise.resolve(
      this.data === undefined
        ? { tag: "does_not_exist" }
        : !this.data.ready
          ? { tag: "starting", cursor: this.data.cursor }
          : { tag: "ready", ...this.data },
    );
  }

  public initialize(path: string, recursive: boolean): Promise<void> {
    console.debug("initialize");

    this.data = {
      ready: false,
      entries: new Map(),
      path,
      recursive,
      cursor: "",
      correctAsOf: 0,
    };

    this.dirty = true;

    return this.flush();
  }

  public addItem(
    item: files.ListFolderResult["entries"][number],
  ): Promise<void> {
    console.debug(`addItem ${item[".tag"]} ${item.path_lower}`);
    if (!item.path_lower) return Promise.resolve();

    if (!this.data) throw new Error("No data");

    // Mutates this.data directly; does NOT serialise & save state.
    // However, at the end of every page, we call setCursor, and that does.

    if (item[".tag"] == "deleted") {
      this.data.entries.delete(item.path_lower);
    } else {
      this.data.entries.set(item.path_lower, item);
    }

    return this.changeMade();
  }

  public setCursor(cursor: string): Promise<void> {
    console.debug(`setCursor ${cursor}`);
    if (!this.data) throw new Error("No data");
    this.dirty ||= cursor !== this.data.cursor;
    this.data.cursor = cursor;
    if (this.data.cursor !== cursor) {
      this.data.cursor = cursor;
      return this.changeMade();
    } else {
      return Promise.resolve();
    }
  }

  public setReady(): Promise<void> {
    console.debug("lsCache setReady");
    if (!this.data) throw new Error("No data");

    this.data.correctAsOf = new Date().getTime();
    this.data.ready = true;
    this.dirty = true;

    return this.flush();
  }

  public flush(): Promise<void> {
    if (!this.dirty) return Promise.resolve();

    return this.save().catch((err: Error) => {
      if ("code" in err && err.code !== "ENOENT") throw err;

      return fs.promises.mkdir(this.dir).then(() => this.save());
    });
  }

  private changeMade(): Promise<void> {
    this.dirty = true;
    const now = new Date().getTime();
    if (this.lastSaved !== 0 && this.lastSaved < now - 5000)
      return this.flush();
    return Promise.resolve();
  }

  private getData(): Promise<Data | undefined> {
    return fs.promises
      .readFile(this.entriesFile, { encoding: "utf-8" })
      .then(
        (contents) => JSON.parse(contents) as Data,
        (err: Error) => {
          if ("code" in err && err.code === "ENOENT") return undefined;
          throw err;
        },
      )
      .then((data) => {
        if (data !== undefined) {
          data = {
            ...data,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            entries: this.entriesToMap((data as any).entries),
          };
        }

        this.data = data;

        return data;
      });
  }

  private save(): Promise<void> {
    if (!this.data) return Promise.resolve(); // Should we unlink instead?

    console.debug(`save lsCache with ${this.data.entries.size} entries`);
    const payload = {
      ...this.data,
      entries: this.entriesToArray(this.data.entries),
    };

    const tmpFile = this.entriesFile + ".tmp";
    return fs.promises
      .writeFile(tmpFile, JSON.stringify(payload) + "\n", {
        encoding: "utf-8",
        mode: 0o600,
      })
      .then(() => fs.promises.rename(tmpFile, this.entriesFile))
      .then(() => (this.dirty = false))
      .then(() => (this.lastSaved = new Date().getTime()))
      .then(() => undefined);
  }

  private entriesToMap(entries: NonDeletedEntries): NonDeletedEntriesMap {
    const map: NonDeletedEntriesMap = new Map();
    for (const entry of entries) {
      if (entry.path_lower !== undefined) map.set(entry.path_lower, entry);
    }

    return map;
  }

  private entriesToArray(entries: NonDeletedEntriesMap): NonDeletedEntries {
    return [...entries.values()];
  }
}
