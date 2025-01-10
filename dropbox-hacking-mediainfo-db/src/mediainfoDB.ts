import * as fs from "fs";

import { MediainfoData } from "./types.js";

export type ContentHash = string;

export type MediainfoFromHash = {
  mediainfoData: MediainfoData;
  addedAt: Date;
  firstSeenFilename: string;
};

type MediainfoFromHashSerializable = {
  mediainfoData: MediainfoData;
  addedAt: string;
  firstSeenFilename: string;
};

type UnwrittenMediainfoFromHash = Map<ContentHash, MediainfoFromHash>;

export class MediainfoDB {
  private unwrittenMediainfoFromHash: UnwrittenMediainfoFromHash = new Map();

  private flushPromise: Promise<void> = Promise.resolve();

  constructor(
    private dir: string,
    private maxUnwritten = 1000,
  ) {}

  public readAll(): Promise<Map<ContentHash, MediainfoFromHash>> {
    return fs.promises
      .readFile(`${this.dir}/mediainfo_by_content_hash.json`, {
        encoding: "utf-8",
      })
      .catch((err: Error) => {
        if ("code" in err && err.code === "ENOENT") return "{}";
        throw err;
      })
      .then(
        (json) =>
          JSON.parse(json) as Record<
            ContentHash,
            MediainfoFromHashSerializable
          >,
      )
      .then((data) => {
        const map = new Map<ContentHash, MediainfoFromHash>();

        for (const hash in data) {
          const value = data[hash];
          const e = value.mediainfoData;

          const mediainfoData = new MediainfoData(e);

          map.set(hash, {
            mediainfoData,
            addedAt: new Date(value.addedAt),
            firstSeenFilename: value.firstSeenFilename,
          });
        }

        return map;
      });
  }

  public storeFromHash(
    contentHash: string,
    mediainfoData: MediainfoData,
    seenAs: string,
  ): Promise<void> {
    console.log(`storeFromHash ${contentHash} ${seenAs}`);

    this.unwrittenMediainfoFromHash.set(contentHash, {
      mediainfoData,
      addedAt: new Date(),
      firstSeenFilename: seenAs,
    });

    if (this.unwrittenMediainfoFromHash.size >= this.maxUnwritten)
      return this.flush();
    else return Promise.resolve();
  }

  public flush(): Promise<void> {
    return (this.flushPromise = this.flushPromise.then(() => {
      const unwritten = this.unwrittenMediainfoFromHash;
      this.unwrittenMediainfoFromHash = new Map();

      console.log(`flush called with ${unwritten.size} unwritten items`);

      return this.writeUnwritten(unwritten);
    }));
  }

  private writeUnwritten(unwritten: UnwrittenMediainfoFromHash): Promise<void> {
    if (unwritten.size === 0) return Promise.resolve();

    const file = `${this.dir}/mediainfo_by_content_hash.json`;
    const tmp = `${file}.tmp`;

    return fs.promises
      .readFile(file, { encoding: "utf-8" })
      .catch((err: Error) => {
        if ("code" in err && err.code === "ENOENT") return "{}";
        throw err;
      })
      .then(
        (json) =>
          JSON.parse(json) as Record<
            ContentHash,
            MediainfoFromHashSerializable
          >,
      )
      .then((data) => {
        for (const [contentHash, item] of unwritten) {
          data[contentHash] = {
            ...item,
            addedAt: item.addedAt.toISOString(),
          };
        }

        console.log(`saving ${Object.keys(data).length} entries to ${file}`);

        return data;
      })
      .then((data) =>
        fs.promises.writeFile(tmp, JSON.stringify(data) + "\n", {
          encoding: "utf-8",
          mode: 0o600,
        }),
      )
      .then(() => fs.promises.rename(tmp, file));
  }
}
