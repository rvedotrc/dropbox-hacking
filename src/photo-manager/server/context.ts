import { Dropbox } from "dropbox";
import * as lsCache from "../../components/lsCache";
import * as exifDb from "../../components/exif/exifDB";

export type Context = {
  get dropboxClient(): Promise<Dropbox>;
  get lsState(): Promise<lsCache.State>;
  get exifDbAll(): ReturnType<exifDb.ExifDB["readAll"]>;
};
