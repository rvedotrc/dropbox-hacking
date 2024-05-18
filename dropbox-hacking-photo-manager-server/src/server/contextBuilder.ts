import { Dropbox } from "dropbox";
import { ExifDB } from "dropbox-hacking-exif-db";
import * as LsCache from "dropbox-hacking-ls-cache";
import { getDropboxClient } from "dropbox-hacking-util";
import { EventEmitter } from "events";
import * as fs from "fs";

import { Context, SubscribableData } from "./context";
import DayDb from "./dayDb";

const makeSafe = (fn: () => void, name: string) => () => {
  try {
    fn();
  } catch (err) {
    console.error(`Error from ${name} function`, err);
  }
};

const waitThenRun = (fn: () => void, delay: number, name?: string) => {
  const safeFn = makeSafe(fn, `waitThenRun ${name}`);
  let timer: NodeJS.Timeout | undefined = undefined;

  return (): void => {
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        safeFn();
      }, delay);
    } else {
      // do nothing
    }
  };
};

const runThenWait = (fn: () => void, delay: number, name?: string) => {
  const safeFn = makeSafe(fn, `runThenWait ${name}`);
  let dirty = false;
  let timer: NodeJS.Timeout | undefined = undefined;

  const fire = () => {
    timer = setTimeout(() => {
      timer = undefined;
      if (dirty) fire();
    }, delay);

    dirty = false;
    safeFn();
  };

  return (): void => {
    if (timer === undefined) {
      fire();
    } else {
      dirty = true;
    }
  };
};

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
    fn = waitThenRun(fn, 500, "fs change");
    fn = runThenWait(fn, 5000, "wait_then_run fs fs change");

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

// class LsFeed
//   extends EventEmitter
//   implements SubscribableData<LsCache.State>
// {
//   private watcher: fs.FSWatcher | undefined = undefined;
//
//   constructor(private readonly lsCacheDir: string) {
//     super();
//   }
//
//   public read(): Promise<LsCache.State> {
//     const lsCache = new LsCache.StateDir(this.lsCacheDir);
//     return lsCache.load().then(() => lsCache.getState());
//   }
// }

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
  };
};
