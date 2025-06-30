import type {
  DayMetadata,
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { type Observable } from "rxjs";

export * from "./types.js";
export * from "./listOfDays.js";
export * from "./basicCounts.js";
export * from "./fsck.js";
export * from "./dayFiles.js";
export * from "./fileId.js";
export * from "./fileRev.js";
export * from "./contentHash.js";
export * from "./exifExplorer.js";
export * from "./closestTo.js";
export * from "./thumbnail.js";
// RVE-add-feed

import * as exifDb from "@blaahaj/dropbox-hacking-exif-db";
import * as mediaInfoDb from "@blaahaj/dropbox-hacking-mediainfo-db";

export const imageFilenamePattern = /\.(jpg|jpeg|png)$/;
export const videoFilenamePattern = /\.(mp4|mov)$/;

export interface FullDatabaseFeeds {
  exifsByContentHash: Observable<Map<exifDb.ContentHash, exifDb.ExifFromHash>>;
  mediaInfoByContentHash: Observable<
    Map<mediaInfoDb.ContentHash, mediaInfoDb.MediainfoFromHash>
  >;
  daysByDate: Observable<Map<string, DayMetadata>>;
  allFilesByRev: Observable<Map<string, NamedFile>>;
  photosById: Observable<Map<string, PhotoDbEntry>>;
}
