import * as fs from "fs";
import { ExifData } from "ts-exif-parser";

export type ContentHash = string;

export type ExifFromHash = {
  exifData: ExifData;
  addedAt: Date;
  firstSeenFilename: string;
};

type ExifByContentHashFile = Record<
  ContentHash,
  Omit<ExifFromHash, "addedAt"> & { addedAt: string }
>;

type UnwrittenExifFromHash = Map<ContentHash, ExifFromHash>;

type SeenLocalFileId = string;

type SeenLocalFile = {
  contentHash: string;
  addedAt: Date;
  firstSeenFilename: string;
};

type SeenLocalFiles = Map<SeenLocalFileId, SeenLocalFile>;

export class ExifDB {
  private unwrittenExifFromHash: UnwrittenExifFromHash = new Map();
  private seenLocalFiles: SeenLocalFiles | undefined = undefined;
  private dirty = false;

  private loadPromise: Promise<void> | undefined = undefined;
  private flushPromise: Promise<void> = Promise.resolve();

  constructor(
    private dir: string,
    private maxUnwritten = 1000,
  ) {}

  public seenFileId(stats: fs.Stats): Promise<boolean> {
    return this.load().then(() => {
      if (!this.seenLocalFiles) throw new Error("no seenIds");

      return this.seenLocalFiles.has(ExifDB.fileIdFromStats(stats));
    });
  }

  public readAll(): Promise<Map<ContentHash, ExifFromHash>> {
    return fs.promises
      .readFile(`${this.dir}/exif_by_content_hash.json`, { encoding: "utf-8" })
      .catch((err: Error) => {
        if ("code" in err && err.code === "ENOENT") return "{}";
        throw err;
      })
      .then((json) => JSON.parse(json) as Record<ContentHash, ExifFromHash>)
      .then((data) => {
        const map = new Map<ContentHash, ExifFromHash>();

        for (const hash in data) {
          const value = data[hash];
          const e = value.exifData;

          const exifData = new ExifData(
            e.startMarker,
            e.tags,
            e.imageSize,
            e.thumbnailOffset,
            e.thumbnailLength,
            e.thumbnailType,
            e.app1Offset,
          );

          map.set(hash, {
            exifData,
            addedAt: new Date(value.addedAt),
            firstSeenFilename: value.firstSeenFilename,
          });
        }

        return map;
      });
  }

  public storeFromLocal(
    stats: fs.Stats,
    contentHash: string,
    exifData: ExifData,
    localFilename: string,
  ): Promise<void> {
    const seen = this.load().then(() => {
      if (!this.seenLocalFiles) throw new Error("no seenIds");

      const fileId = ExifDB.fileIdFromStats(stats);

      console.log(`storeFromLocal ${fileId} ${contentHash} ${localFilename}`);

      this.seenLocalFiles.set(fileId, {
        contentHash,
        addedAt: new Date(),
        firstSeenFilename: localFilename,
      });

      this.dirty = true;
    });

    const hash = this.storeFromHash(contentHash, exifData, localFilename);

    return Promise.all([seen, hash]).then(() => undefined);
  }

  public storeFromHash(
    contentHash: string,
    exifData: ExifData,
    seenAs: string,
  ): Promise<void> {
    return this.load().then(() => {
      console.log(
        `storeFromHash ${contentHash} ${exifData.tags?.CreateDate} ${seenAs}`,
      );

      this.unwrittenExifFromHash.set(contentHash, {
        exifData,
        addedAt: new Date(),
        firstSeenFilename: seenAs,
      });

      if (this.unwrittenExifFromHash.size >= this.maxUnwritten)
        void this.flush();
    });
  }

  public flush(): Promise<void> {
    return (this.flushPromise = this.flushPromise
      .then(() => this.load())
      .then(() => {
        if (!this.seenLocalFiles) throw new Error("no seenIds");

        const unwritten = this.unwrittenExifFromHash;
        const seenLocalFiles = new Map(this.seenLocalFiles);
        this.unwrittenExifFromHash = new Map();

        console.log(
          `flush called with ${unwritten.size} unwritten items and ${seenLocalFiles.size} files`,
        );

        return this.writeUnwritten(unwritten).then(() =>
          this.saveSeenLocalFiles(seenLocalFiles),
        );
      }));
  }

  private writeUnwritten(unwritten: UnwrittenExifFromHash): Promise<void> {
    if (unwritten.size === 0) return Promise.resolve();

    const file = `${this.dir}/exif_by_content_hash.json`;
    const tmp = `${file}.tmp`;

    return fs.promises
      .readFile(file, { encoding: "utf-8" })
      .catch((err: Error) => {
        if ("code" in err && err.code === "ENOENT") return "{}";
        throw err;
      })
      .then((json) => JSON.parse(json) as ExifByContentHashFile)
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

  private saveSeenLocalFiles(seenLocalFiles: SeenLocalFiles): Promise<void> {
    if (!this.dirty) return Promise.resolve();

    const file = `${this.dir}/seen_local_files.json`;
    const tmp = `${file}.tmp`;

    const data: Record<string, unknown> = {};

    for (const [k, v] of seenLocalFiles) {
      data[k] = {
        ...v,
        addedAt: v.addedAt.toISOString(),
      };
    }

    return fs.promises
      .writeFile(tmp, JSON.stringify(data) + "\n", {
        encoding: "utf-8",
        mode: 0o600,
      })
      .then(() => fs.promises.rename(tmp, file))
      .then(() => {
        this.dirty = false;
      });
  }

  private static fileIdFromStats(stats: fs.Stats): string {
    return `${stats.dev}.${stats.ino}`;
  }

  private load(): Promise<void> {
    if (this.seenLocalFiles !== undefined) return Promise.resolve();
    if (this.loadPromise !== undefined) return this.loadPromise;

    return (this.loadPromise = fs.promises
      .readFile(`${this.dir}/seen_local_files.json`, { encoding: "utf-8" })
      .catch((err: Error) => {
        if ("code" in err && err.code === "ENOENT") return "{}";
        throw err;
      })
      .then((text) => JSON.parse(text) as Record<string, SeenLocalFile>)
      .then((data) => {
        const map: SeenLocalFiles = new Map();
        for (const k in data) {
          const v = data[k];
          map.set(k, {
            contentHash: v.contentHash,
            addedAt: new Date(v.addedAt),
            firstSeenFilename: v.firstSeenFilename,
          });
        }
        return map;
      })
      .then((seenLocalFiles: SeenLocalFiles) => {
        this.seenLocalFiles = seenLocalFiles;
        this.loadPromise = undefined;
      }));
  }
}
