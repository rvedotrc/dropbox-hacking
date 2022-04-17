import { Context } from "./context";
import * as LsCache from "../../components/lsCache";
import { ExifDB } from "../../components/exif/exifDB";
import { getDropboxClient } from "../../auth";

export default (): Context => {
  const exifDbDir = process.env.EXIF_DB_DIR;
  if (exifDbDir === undefined) throw "Need EXIF_DB_DIR";

  const lsCacheDir = process.env.LS_CACHE_DIR;
  if (lsCacheDir === undefined) throw "Need LS_CACHE_DIR";

  const lsCache = new LsCache.StateDir(lsCacheDir);
  const lsState = lsCache.load().then(() => lsCache.getState());

  const exifDb = new ExifDB(exifDbDir);
  const exifAll = exifDb.readAll();

  return {
    get dropboxClient() {
      return getDropboxClient();
    },
    get lsState() {
      return lsState;
    },
    get exifDbAll() {
      return exifAll;
    },
  };
};
