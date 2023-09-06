import { Dropbox } from "dropbox";
import * as exifDb from "dropbox-hacking-exif-db";
import * as lsCache from "dropbox-hacking-ls-cache";

import DayDb from "./dayDb";

export type Context = {
  readonly port: number;
  readonly baseUrlWithoutSlash: string;
  get dropboxClient(): Promise<Dropbox>;
  get lsState(): Promise<lsCache.State>;
  get exifDbAll(): ReturnType<exifDb.ExifDB["readAll"]>;
  get dayDb(): Promise<DayDb>;
};
