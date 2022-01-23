import { ExifParserFactory } from "ts-exif-parser";
import limiter, { Limiter } from "./uploader/limiter";
import * as fs from "fs";
import * as path from "path";
import makeContentHash from "./uploader/content-hash";
import { ExifData } from "ts-exif-parser";
import { Buffer } from "buffer";
import { ReadStream } from "fs";

type ContentHash = string;

type ExifFromHash = {
  exifData: ExifData;
  addedAt: Date;
  firstSeenFilename: string;
};

type UnwrittenExifFromHash = Map<ContentHash, ExifFromHash>;

type SeenLocalFileId = string;

type SeenLocalFile = {
  contentHash: string;
  addedAt: Date;
  firstSeenFilename: string;
};

type SeenLocalFiles = Map<SeenLocalFileId, SeenLocalFile>;

class ExifDB {
  private unwrittenExifFromHash: UnwrittenExifFromHash = new Map();

  private seenLocalFiles: SeenLocalFiles | undefined = undefined;

  private loadPromise: Promise<void> | undefined = undefined;
  private flushPromise: Promise<void> = Promise.resolve();

  constructor(private dir: string, private maxUnwritten = 100) {}

  public seenFileId(stats: fs.Stats): Promise<boolean> {
    return this.load().then(() => {
      if (!this.seenLocalFiles) throw "no seenIds";

      return this.seenLocalFiles.has(ExifDB.fileIdFromStats(stats));
    });
  }

  public store(
    stats: fs.Stats,
    contentHash: string,
    exifData: ExifData,
    localFilename: string
  ): Promise<void> {
    return this.load().then(() => {
      if (!this.seenLocalFiles) throw "no seenIds";

      const fileId = ExifDB.fileIdFromStats(stats);
      console.log(
        `store ${fileId} ${contentHash} ${exifData.tags?.ExposureTime} ${localFilename}`
      );
      this.unwrittenExifFromHash.set(contentHash, {
        exifData,
        addedAt: new Date(),
        firstSeenFilename: localFilename,
      });
      this.seenLocalFiles.set(fileId, {
        contentHash,
        addedAt: new Date(),
        firstSeenFilename: localFilename,
      });

      if (this.unwrittenExifFromHash.size >= this.maxUnwritten) this.flush();
    });
  }

  public flush(): Promise<void> {
    return (this.flushPromise = this.flushPromise
      .then(() => this.load())
      .then(() => {
        if (!this.seenLocalFiles) throw "no seenIds";

        const unwritten = this.unwrittenExifFromHash;
        const seenLocalFiles = new Map(this.seenLocalFiles);
        this.unwrittenExifFromHash = new Map();

        console.log(
          `flush called with ${unwritten.size} unwritten items and ${seenLocalFiles.size} files`
        );

        return this.writeUnwritten(unwritten).then(() =>
          this.saveSeenLocalFiles(seenLocalFiles)
        );
      }));
  }

  private writeUnwritten(unwritten: UnwrittenExifFromHash): Promise<void> {
    const file = `${this.dir}/exif_by_content_hash.json`;
    const tmp = `${file}.tmp`;

    return fs.promises
      .readFile(file, { encoding: "utf-8" })
      .catch((err) => {
        if (err.code === "ENOENT") return "{}";
        throw err;
      })
      .then((json) => JSON.parse(json))
      .then((data) => {
        for (const [contentHash, item] of unwritten) {
          data[contentHash] = {
            ...item,
            addedAt: item.addedAt.toISOString(),
          };
        }

        return data;
      })
      .then((data) =>
        fs.promises.writeFile(tmp, JSON.stringify(data) + "\n", {
          encoding: "utf-8",
          mode: 0o600,
        })
      )
      .then(() => fs.promises.rename(tmp, file));
  }

  private saveSeenLocalFiles(seenLocalFiles: SeenLocalFiles): Promise<void> {
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
      .then(() => fs.promises.rename(tmp, file));
  }

  private static fileIdFromStats(stats: fs.Stats): string {
    return `${stats.dev}.${stats.ino}`;
  }

  private load(): Promise<void> {
    if (this.seenLocalFiles !== undefined) return Promise.resolve();
    if (this.loadPromise !== undefined) return this.loadPromise;

    return (this.loadPromise = fs.promises
      .readFile(`${this.dir}/seen_local_files.json`, { encoding: "utf-8" })
      .catch((err) => {
        if (err.code === "ENOENT") return "{}";
        throw err;
      })
      .then((text) => JSON.parse(text))
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

const exifFromStream = (r: ReadStream): Promise<ExifData> =>
  new Promise<ExifData>((resolve, reject) => {
    let exifBuffer = Buffer.alloc(0);

    r.on("data", (chunk: Buffer) => {
      if (exifBuffer.length < 65536) {
        exifBuffer = Buffer.concat([
          exifBuffer,
          chunk.slice(0, 65536 - exifBuffer.length),
        ]);
      }
    });

    r.on("end", () => {
      try {
        console.log(`Exif parsing from`, exifBuffer);
        const parser = ExifParserFactory.create(exifBuffer);
        const exifData = parser.parse();
        console.log({ exifData });
        resolve(exifData);
      } catch (e) {
        reject(e);
      }
    });

    r.on("error", reject);
  });

const processFile = (
  filename: string,
  stats: fs.Stats,
  fileLimiter: Limiter<void>,
  exifDB: ExifDB
): Promise<void> => {
  if (!filename.toLowerCase().endsWith(".jpg")) return Promise.resolve();

  return fileLimiter.submit(
    () =>
      exifDB.seenFileId(stats).then((seen) => {
        if (seen) {
          console.log(
            `Already seen ${stats.dev}.${stats.ino} (${filename}), skipping`
          );
          return Promise.resolve();
        }

        const r = fs.createReadStream(filename);

        return Promise.all([makeContentHash(r), exifFromStream(r)]).then(
          ([hash, exifData]) => exifDB.store(stats, hash, exifData, filename)
        );
      }),
    filename
  );
};

const scanDir = (
  dir: string,
  fileLimiter: Limiter<void>,
  exifDB: ExifDB
): Promise<void> =>
  fs.promises
    .readdir(dir)
    .then((entries) =>
      Promise.all(
        entries.map((entry) =>
          entry === "." || entry === ".."
            ? Promise.resolve()
            : statAndProcess(path.join(dir, entry), fileLimiter, exifDB)
        )
      ).then(() => undefined)
    );

const statAndProcess = (
  item: string,
  fileLimiter: Limiter<void>,
  exifDB: ExifDB
): Promise<void> =>
  fs.promises
    .lstat(item)
    .then((stat) =>
      stat.isFile()
        ? processFile(item, stat, fileLimiter, exifDB)
        : stat.isDirectory()
        ? scanDir(item, fileLimiter, exifDB)
        : Promise.resolve()
    );

const main = () => {
  const fileLimiter = limiter<void>(4);
  const exifDB = new ExifDB("var/exifdb");

  Promise.all(
    process.argv.slice(2).map((dir) => statAndProcess(dir, fileLimiter, exifDB))
  )
    .then(() => exifDB.flush())
    .then(() => console.log("done"))
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

// would be nice to store:
// when added, filename when added

main();
