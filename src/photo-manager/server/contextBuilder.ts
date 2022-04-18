import { Context } from "./context";
import * as LsCache from "../../components/lsCache";
import { ExifDB } from "../../components/exif/exifDB";
import { getDropboxClient } from "../../auth";
import * as fs from "fs";
import DayDb from "./dayDb";

export default (): Context => {
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
    get dropboxClient() {
      return getDropboxClient();
    },
    get lsState() {
      if (!lsCacheState) {
        const lsCache = new LsCache.StateDir(lsCacheDir);
        lsCacheState = lsCache.load().then(() => lsCache.getState());
      }
      return lsCacheState;
    },
    get exifDbAll() {
      if (!exifAll) {
        const exifDb = new ExifDB(exifDbDir);
        exifAll = exifDb.readAll();
      }
      return exifAll;
    },
    get dayDb() {
      return Promise.resolve(new DayDb(dayDbDir));
    },
  };
};
