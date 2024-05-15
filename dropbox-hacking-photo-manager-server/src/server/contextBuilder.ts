import { Dropbox } from "dropbox";
import { ExifDB } from "dropbox-hacking-exif-db";
import * as LsCache from "dropbox-hacking-ls-cache";
import { getDropboxClient } from "dropbox-hacking-util";
import * as fs from "fs";

import { Context } from "./context";
import DayDb from "./dayDb";

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

  let exifAll: ReturnType<ExifDB["readAll"]> | undefined;
  fs.watch(lsCacheDir, () => {
    exifAll = undefined;
  });

  let lsCacheState: Promise<LsCache.State> | undefined = undefined;
  fs.watch(lsCacheDir, () => {
    lsCacheState = undefined;
  });

  return {
    port: args.port,
    baseUrlWithoutSlash: args.baseUrlWithoutSlash,
    get dropboxClient(): Promise<Dropbox> {
      return getDropboxClient();
    },
    get lsState(): Promise<LsCache.State> {
      if (lsCacheState === undefined) {
        const lsCache = new LsCache.StateDir(lsCacheDir);
        lsCacheState = lsCache.load().then(() => lsCache.getState());
      }
      return lsCacheState;
    },
    get exifDbAll(): ReturnType<ExifDB["readAll"]> {
      if (exifAll === undefined) {
        const exifDb = new ExifDB(exifDbDir);
        exifAll = exifDb.readAll();
      }
      return exifAll;
    },
    get dayDb(): Promise<DayDb> {
      return Promise.resolve(new DayDb(dayDbDir));
    },
  };
};
