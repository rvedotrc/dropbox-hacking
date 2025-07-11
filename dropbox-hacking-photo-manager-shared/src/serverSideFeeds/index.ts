import type {
  DayMetadata,
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { type Observable } from "rxjs";

export type RxFeedRequest =
  // legacy whole-database stuff
  | { readonly type: "rx-days" }
  | { readonly type: "rx-exif" }
  | { readonly type: "rx-photos" }
  | { readonly type: "rx-files" }

  // more focussed feeds
  | BasicCountsRequest
  | ClosestToRequest
  | ContentHashRequest
  | DayFilesRequest
  | ExifExplorerRequest
  | FileIdRequest
  | FileRevRequest
  | FsckRequest
  | ListOfDaysRequest
  | TagsRequest
  | ThumbnailRequest;

// RVE-add-feed

export * from "./basicCounts.js";
export * from "./closestTo.js";
export * from "./contentHash.js";
export * from "./dayFiles.js";
export * from "./exifExplorer.js";
export * from "./fileId.js";
export * from "./fileRev.js";
export * from "./fsck.js";
export * from "./listOfDays.js";
export * from "./tags.js";
export * from "./thumbnail.js";
// RVE-add-feed

import * as exifDb from "@blaahaj/dropbox-hacking-exif-db";
import * as mediaInfoDb from "@blaahaj/dropbox-hacking-mediainfo-db";

import type { BasicCountsRequest } from "./basicCounts.js";
import type { ClosestToRequest } from "./closestTo.js";
import type { ContentHashRequest } from "./contentHash.js";
import type { DayFilesRequest } from "./dayFiles.js";
import type { ExifExplorerRequest } from "./exifExplorer.js";
import type { FileIdRequest } from "./fileId.js";
import type { FileRevRequest } from "./fileRev.js";
import type { FsckRequest } from "./fsck.js";
import type { ListOfDaysRequest } from "./listOfDays.js";
import type { TagsRequest } from "./tags.js";
import type { ThumbnailRequest } from "./thumbnail.js";

export const imageFilenamePattern = /\.(jpg|jpeg|png)$/;
export const videoFilenamePattern = /\.(mp4|mov)$/;

export interface FullDatabaseFeeds {
  exifsByContentHash: Observable<Map<exifDb.ContentHash, exifDb.ExifFromHash>>;
  mediaInfoByContentHash: Observable<
    Map<mediaInfoDb.ContentHash, mediaInfoDb.MediainfoFromHash>
  >;
  daysByDate: Observable<Map<string, DayMetadata>>;
  allFilesByRev: Observable<Map<string, NamedFile>>;
  photosByContentHash: Observable<Map<string, PhotoDbEntry>>;
}
