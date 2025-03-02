import * as fs from "fs";

import { MediainfoDB } from "./mediainfoDB.js";
import { MediainfoData } from "./types.js";

export type State =
  | { tag: "does_not_exist" }
  | { tag: "starting"; cursor: string }
  | {
      tag: "ready";
      cursor: string;
      path: string;
      recursive: boolean;
      correctAsOf: number;
    };

type Data = {
  ready: boolean;
  cursor: string;
  path: string;
  recursive: boolean;
  correctAsOf: number;
  seenContentHashes: Set<string>;
};

export class StateDir {
  private data: Data | undefined;
  private readonly stateFile: string;
  private dirty: boolean = false;
  private lastSaved: number;

  constructor(
    private dir: string,
    private mediainfoDB: MediainfoDB,
  ) {
    this.stateFile = `${dir}/state.json`;
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

  public async initialize(path: string, recursive: boolean): Promise<void> {
    console.debug("initialize");

    const seenContentHashes = await this.mediainfoDB
      .readAll()
      .then((map) => new Set(map.keys()));

    this.data = {
      ready: false,
      path,
      recursive,
      cursor: "",
      correctAsOf: 0,
      seenContentHashes,
    };

    this.dirty = true;

    return this.flush();
  }

  public hasContentHash(contentHash: string): boolean {
    if (!this.data) throw new Error("No data");

    return this.data.seenContentHashes.has(contentHash);
  }

  public addFile(
    contentHash: string,
    mediainfoData: MediainfoData,
    seenAs: string,
  ): Promise<void> {
    console.debug(`addItem ${contentHash} ${seenAs}`);

    if (!this.data) throw new Error("No data");

    // Mutates this.data directly; does NOT serialise & save state.
    // However, at the end of every page, we call setCursor, and that does.

    return this.mediainfoDB
      .storeFromHash(contentHash, mediainfoData, seenAs)
      .then(() => {
        this.data?.seenContentHashes.add(contentHash);
      });
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
    console.debug("setReady mediainfo state");
    if (!this.data) throw new Error("No data");

    this.data.correctAsOf = new Date().getTime();
    this.data.ready = true;
    this.dirty = true;

    return this.flush();
  }

  public flush(): Promise<void> {
    return this.mediainfoDB.flush().then(() => {
      if (!this.dirty) return;

      return this.save().catch((err: Error) => {
        if (!("code" in err) || err.code !== "ENOENT") throw err;

        return fs.promises.mkdir(this.dir).then(() => this.save());
      });
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
    const getPollState = fs.promises
      .readFile(this.stateFile, { encoding: "utf-8" })
      .then(
        (contents) => JSON.parse(contents) as Omit<Data, "seenContentHashes">,
        (err: Error) => {
          if ("code" in err && err.code === "ENOENT") return undefined;
          throw err;
        },
      );

    const getSeenHashes = this.mediainfoDB
      .readAll()
      .then((map) => new Set(map.keys()));

    return Promise.all([getPollState, getSeenHashes]).then(
      ([pollState, seenContentHashes]) => {
        if (pollState !== undefined) {
          return { ...pollState, seenContentHashes };
        } else {
          return undefined;
        }
      },
    );
  }

  private save(): Promise<void> {
    if (!this.data) return Promise.resolve(); // Should we unlink instead?

    console.debug(
      `save mediainfo state ${this.data.cursor} ${this.data.correctAsOf}`,
    );
    const payload = this.data;

    const tmpFile = this.stateFile + ".tmp";
    return fs.promises
      .writeFile(tmpFile, JSON.stringify(payload) + "\n", {
        encoding: "utf-8",
        mode: 0o600,
      })
      .then(() => fs.promises.rename(tmpFile, this.stateFile))
      .then(() => (this.dirty = false))
      .then(() => (this.lastSaved = new Date().getTime()))
      .then(() => undefined);
  }
}
