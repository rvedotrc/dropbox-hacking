import type {
  DayMetadata,
  GPSLatLong,
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { type Observable } from "rxjs";

// RVE-add-feed

export * from "./basicCounts.js";
export * from "./closestTo.js";
export * from "./contentHash.js";
export * from "./dayFiles.js";
export * from "./exifExplorer.js";
export * from "./feedMap.js";
export * from "./fileId.js";
export * from "./fileRev.js";
export * from "./fsck.js";
export * from "./listOfDays.js";
export * from "./tags.js";
export * from "./thumbnail.js";
export * from "./video.js";

import * as exifDb from "@blaahaj/dropbox-hacking-exif-db";
import * as mediaInfoDb from "@blaahaj/dropbox-hacking-mediainfo-db";

export const imageFilenamePattern = /\.(jpg|jpeg|png)$/;
export const videoFilenamePattern = /\.(mp4|mov)$/;

export type ContentHashCollection = {
  readonly namedFiles: readonly NamedFile[];
  readonly exif: exifDb.ExifFromHash | null;
  readonly mediaInfo: mediaInfoDb.MediainfoFromHash | null;
  readonly photo: PhotoDbEntry | null;
  readonly gps: GPSLatLong | null;
  readonly timestamp: string;
  readonly date: string;
};

export interface FullDatabaseFeeds {
  exifsByContentHash: Observable<Map<exifDb.ContentHash, exifDb.ExifFromHash>>;
  mediaInfoByContentHash: Observable<
    Map<mediaInfoDb.ContentHash, mediaInfoDb.MediainfoFromHash>
  >;
  daysByDate: Observable<Map<string, DayMetadata>>;
  allFilesByRev: Observable<Map<string, NamedFile>>;
  photosByContentHash: Observable<Map<string, PhotoDbEntry>>;
  byContentHash: Observable<ReadonlyMap<string, ContentHashCollection>>;
}
