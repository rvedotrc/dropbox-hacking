import { ExifParserFactory } from "ts-exif-parser";
import limiter, { Limiter } from "./uploader/limiter";
import * as fs from "fs";
import * as path from "path";
import makeContentHash from "./uploader/content-hash";
import { ExifData } from "ts-exif-parser";
import { Buffer } from "buffer";
import { ReadStream } from "fs";
import { ExifDB } from "./exif/exifDB";

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
        // console.log(`Exif parsing from`, exifBuffer);
        const parser = ExifParserFactory.create(exifBuffer);
        const exifData = parser.parse();
        // console.log({ exifData });
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
