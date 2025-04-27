import { Dropbox } from "dropbox";
import * as exifDb from "@blaahaj/dropbox-hacking-exif-db";
import * as lsCache from "@blaahaj/dropbox-hacking-ls-cache";
import {
  DayMetadata,
  type NamedFile,
  type PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { EventEmitter } from "events";

import DayDb from "./dayDb.js";
import type { Observable } from "rxjs";

export type SubscribableData<T> = EventEmitter & {
  on: (eventName: "change", fn: () => void) => void;
  off: (eventName: "change", fn: () => void) => void;
  read: () => Promise<T>;
};

export type Context = {
  readonly port: number;
  readonly baseUrlWithoutSlash: string;
  get dropboxClient(): Promise<Dropbox>;
  readonly lsFeed: SubscribableData<lsCache.State>;
  readonly exifDbFeed: SubscribableData<
    Awaited<ReturnType<exifDb.ExifDB["readAll"]>>
  >;
  readonly daysFeed: SubscribableData<DayMetadata[]>;
  readonly dayDb: DayDb;
  readonly close: () => Promise<void>;

  exifRx: () => Observable<Record<exifDb.ContentHash, exifDb.ExifFromHash>>;
  dayRx: () => Observable<Record<string, DayMetadata>>;
  imageFilesRx: () => Observable<Record<string, NamedFile>>;
  photoRx: () => Observable<Record<string, PhotoDbEntry>>;
};
