import { Dropbox } from "dropbox";
import * as exifDb from "dropbox-hacking-exif-db";
import * as lsCache from "dropbox-hacking-ls-cache";
import { DayMetadata } from "dropbox-hacking-photo-manager-shared";
import { EventEmitter } from "events";

import DayDb from "./dayDb";

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
  // FIXME: close()
};
