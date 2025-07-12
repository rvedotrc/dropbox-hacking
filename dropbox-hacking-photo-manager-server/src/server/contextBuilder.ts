import { ExifDB } from "@blaahaj/dropbox-hacking-exif-db";
import * as LsCache from "@blaahaj/dropbox-hacking-ls-cache";
import { getDropboxClient } from "@blaahaj/dropbox-hacking-util";
import { Dropbox } from "dropbox";
import type { FullDatabaseFeeds } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { EventEmitter } from "events";
import * as fs from "fs";

import { Context, SubscribableData } from "./context.js";
import DayDb from "./dayDb.js";
import debounce from "./debounce.js";
import { buildForDayDb, buildForDayDbMap } from "./rx/dayDb.js";
import { buildForExifDb, buildForExifDbMap } from "./rx/exifDb.js";
import { buildForLsCache, buildForLsCacheMapAllFiles } from "./rx/lsCache.js";
import { buildForMediaInfoDbMap } from "./rx/mediaInfoDb.js";
import { buildForPhotoDb, buildForPhotoDbMap } from "./rx/photoDb.js";

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

  const mediaInfoDbDir = process.env.MEDIAINFO_DB_DIR;
  if (mediaInfoDbDir === undefined) throw new Error("Need MEDIAINFO_DB_DIR");

  const lsCacheDir = process.env.LS_CACHE_DIR;
  if (lsCacheDir === undefined) throw new Error("Need LS_CACHE_DIR");

  const dayDbDir = process.env.DAY_DB_DIR;
  if (dayDbDir === undefined) throw new Error("Need DAY_DB_DIR");

  const photoDbDir = process.env.PHOTO_DB_DIR;
  if (photoDbDir === undefined) throw new Error("Need PHOTO_DB_DIR");

  // RX

  const exifRxMap = buildForExifDbMap(exifDbDir);
  const mediaInfoRxMap = buildForMediaInfoDbMap(mediaInfoDbDir);
  const daysRxMap = buildForDayDbMap(dayDbDir);
  const allFilesRxMap = buildForLsCacheMapAllFiles(lsCacheDir);
  const photosRxMap = buildForPhotoDbMap(photoDbDir);

  const fullDatabaseFeeds: FullDatabaseFeeds = {
    exifsByContentHash: exifRxMap.observable(),
    mediaInfoByContentHash: mediaInfoRxMap.observable(),
    daysByDate: daysRxMap.observable(),
    allFilesByRev: allFilesRxMap.observable(),
    photosByContentHash: photosRxMap.observable(),
  };

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

    exifRxMap.close();
    mediaInfoRxMap.close();
    daysRxMap.close();
    allFilesRxMap.close();
    photosRxMap.close();

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
    photoRxUpdater: photoRx.update,
    photoRxTransformer: photoRx.transform,

    lsFeed,
    exifDbFeed,
    daysFeed,
    dayDb,

    fullDatabaseFeeds,

    close,
  };
};
