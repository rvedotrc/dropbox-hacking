import { Dropbox } from "dropbox";
import { ExifDB } from "dropbox-hacking-exif-db";
import * as LsCache from "dropbox-hacking-ls-cache";
import { getDropboxClient } from "dropbox-hacking-util";
import { EventEmitter } from "events";
import * as fs from "fs";

import { Context, SubscribableData } from "./context";
import DayDb from "./dayDb";
import debounce from "./debounce";

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

    let fn: () => void = () => this.emit("change");
    fn = debounce.waitThenRun(fn, 500, "fs change");
    fn = debounce.runThenWait(fn, 5000, "wait_then_run fs fs change");

    this.watcher = fs.watch(this.dir, fn);
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
  if (exifDbDir === undefined) throw "Need EXIF_DB_DIR";

  const lsCacheDir = process.env.LS_CACHE_DIR;
  if (lsCacheDir === undefined) throw "Need LS_CACHE_DIR";

  const dayDbDir = process.env.DAY_DB_DIR;
  if (dayDbDir === undefined) throw "Need DAY_DB_DIR";

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
  const daysFeed = new FilesystemBasedFeed(dayDbDir, dayDb.days);
  daysFeed.start();
  // FIXME: close()

  const close = async () => {
    lsFeed.stop();
    exifDbFeed.stop();
    daysFeed.stop();
  };

  return {
    port: args.port,
    baseUrlWithoutSlash: args.baseUrlWithoutSlash,
    get dropboxClient(): Promise<Dropbox> {
      return getDropboxClient();
    },
    lsFeed,
    exifDbFeed,
    daysFeed,
    dayDb,
    close,
  };
};
