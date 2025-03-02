import { Dropbox } from "dropbox";
import { ExifDB } from "dropbox-hacking-exif-db";
import * as LsCache from "dropbox-hacking-ls-cache";
import { getDropboxClient } from "dropbox-hacking-util";
import { EventEmitter } from "events";
import * as fs from "fs";

import { Context, SubscribableData } from "./context.js";
import DayDb from "./dayDb.js";
import debounce from "./debounce.js";
import { buildForDayDb } from "./rx/dayDb.js";
import { buildForExifDb } from "./rx/exifDb.js";
import { buildForLsCache } from "./rx/lsCache.js";
import { buildForPhotoDb } from "./rx/photoDb.js";

class FilesystemBasedFeed<T>
  extends EventEmitter
  implements SubscribableData<T>
{
  private watcher: fs.FSWatcher | undefined = undefined;

  constructor(
    private readonly dir: string,
    private readonly loader: () => Promise<T>,
  ) {
    super();
  }

  public start(): void {
    if (this.watcher !== undefined) return;

    let fn: () => void = () => {
      console.debug(`FilesystemBasedFeed ${this.dir} emit change`);
      this.emit("change");
    };
    fn = debounce.waitThenRun(fn, 500, "fs change");
    fn = debounce.runThenWait(fn, 5000, "wait_then_run fs fs change");
    const base = () => {
      console.debug(`FilesystemBasedFeed ${this.dir} fswatch event`);
      fn();
    };

    this.watcher = fs.watch(this.dir, base);
  }

  public stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  public read(): Promise<T> {
    return this.loader();
  }
}

export default (args: {
  port: number;
  baseUrlWithoutSlash: string;
}): Context => {
  const exifDbDir = process.env.EXIF_DB_DIR;
  if (exifDbDir === undefined) throw new Error("Need EXIF_DB_DIR");

  const lsCacheDir = process.env.LS_CACHE_DIR;
  if (lsCacheDir === undefined) throw new Error("Need LS_CACHE_DIR");

  const dayDbDir = process.env.DAY_DB_DIR;
  if (dayDbDir === undefined) throw new Error("Need DAY_DB_DIR");

  const photoDbDir = process.env.PHOTO_DB_DIR;
  if (photoDbDir === undefined) throw new Error("Need PHOTO_DB_DIR");

  // RX

  const exifRx = buildForExifDb(exifDbDir);
  const dayRx = buildForDayDb(dayDbDir);
  const photoRx = buildForPhotoDb(photoDbDir);
  const imageFilesRx = buildForLsCache(lsCacheDir);

  // Older

  const lsFeed = new FilesystemBasedFeed(lsCacheDir, () => {
    const lsCache = new LsCache.StateDir(lsCacheDir);
    return lsCache.load().then(() => lsCache.getState());
  });
  lsFeed.start();
  // FIXME: close()

  const exifDbFeed = new FilesystemBasedFeed(exifDbDir, () => {
    const exifDb = new ExifDB(exifDbDir);
    return exifDb.readAll();
  });
  exifDbFeed.start();
  // FIXME: close()

  const dayDb = new DayDb(dayDbDir);
  const daysFeed = new FilesystemBasedFeed(dayDbDir, () => dayDb.days());
  daysFeed.start();
  // FIXME: close()

  const close = async () => {
    exifRx.close();
    dayRx.close();
    photoRx.close();
    imageFilesRx.close();

    await Promise.allSettled([
      lsFeed.stop(),
      exifDbFeed.stop(),
      daysFeed.stop(),
    ]);
  };

  return {
    port: args.port,
    baseUrlWithoutSlash: args.baseUrlWithoutSlash,
    get dropboxClient(): Promise<Dropbox> {
      return getDropboxClient();
    },

    exifRx: exifRx["observable"],
    imageFilesRx: imageFilesRx["observable"],
    dayRx: dayRx["observable"],
    photoRx: photoRx["observable"],

    lsFeed,
    exifDbFeed,
    daysFeed,
    dayDb,
    close,
  };
};
