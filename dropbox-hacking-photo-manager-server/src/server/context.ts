import { Dropbox } from "dropbox";
import { type PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import type { FullDatabaseFeeds } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { EventEmitter } from "events";

import type { ThumbnailFetcher } from "./api/websocket/thumbnailFetcher.js";
import DayDb from "./dayDb.js";
import type { PhotoDb } from "./rx/photoDb.js";

export type SubscribableData<T> = EventEmitter & {
  on: (eventName: "change", fn: () => void) => void;
  off: (eventName: "change", fn: () => void) => void;
  read: () => Promise<T>;
};

export type Context = {
  readonly port: number;
  readonly baseUrlWithoutSlash: string;
  get dropboxClient(): Promise<Dropbox>;
  readonly dayDb: DayDb;
  readonly close: () => Promise<void>;

  photoRxUpdater: (args: {
    contentHash: string;
    entry: PhotoDbEntry;
  }) => Promise<void>;
  photoRxTransformer: (
    transform: (old: PhotoDb) => Promise<PhotoDb>,
  ) => Promise<void>;

  fullDatabaseFeeds: FullDatabaseFeeds;
  thumbnailFetcher: ThumbnailFetcher;
};
