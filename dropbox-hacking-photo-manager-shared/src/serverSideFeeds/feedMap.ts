import type { Observable, ObservedValueOf } from "rxjs";

import { provideBasicCounts } from "./basicCounts.js";
import { provideClosestTo } from "./closestTo.js";
import { provideContentHash } from "./contentHash.js";
import { provideDayFiles } from "./dayFiles.js";
import { provideExifExplorer } from "./exifExplorer.js";
import { provideFileId } from "./fileId.js";
import { provideFileRev } from "./fileRev.js";
import { provideFsck } from "./fsck.js";
import { type FullDatabaseFeeds } from "./index.js";
import { provideListOfDaysWithoutSamples } from "./listOfDays.js";
import { provideMediaInfoExplorer } from "./mediaInfoExplorer.js";
import { provideSearch } from "./search.js";
import { provideTags } from "./tags.js";
import {
  provideThumbnail,
  type ThumbnailRequest,
  type ThumbnailResponse,
} from "./thumbnail.js";
import { provideVideo } from "./video.js";

type Provider<REQ, RES> = (
  feeds: FullDatabaseFeeds,
  request: REQ,
) => Observable<RES>;

type SPEC<NAME extends string, REQ extends { readonly type: NAME }, RES> = {
  readonly name: NAME;
  readonly provider: Provider<REQ, RES>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Builder<FEEDMAP extends { [K in string]: any }> {
  public static init() {
    return new Builder({});
  }

  constructor(public readonly feedMap: FEEDMAP) {}

  public addFeed<NAME extends string, REQ extends { readonly type: NAME }, RES>(
    name: NAME,
    provider: Provider<REQ, RES>,
  ) {
    return new Builder({
      ...this.feedMap,
      [name]: { name, provider },
    } as FEEDMAP & Record<NAME, SPEC<NAME, REQ, RES>>);
  }
}

export const buildFeedMap = (
  thumbnailHandler: (req: ThumbnailRequest) => Promise<ThumbnailResponse>,
) =>
  Builder.init()
    .addFeed("rx.ng.basic-counts", provideBasicCounts)
    .addFeed("rx.ng.closest-to", provideClosestTo)
    .addFeed("rx.ng.content_hash", provideContentHash)
    .addFeed("rx.ng.day.files", provideDayFiles)
    .addFeed("rx.ng.exif-explorer", provideExifExplorer)
    .addFeed("rx.ng.file.id", provideFileId)
    .addFeed("rx.ng.file.rev", provideFileRev)
    .addFeed("rx.ng.fsck", provideFsck)
    .addFeed("rx.ng.list-of-days", provideListOfDaysWithoutSamples)
    .addFeed("rx.ng.tags", provideTags)
    .addFeed("rx.ng.thumbnail2", provideThumbnail(thumbnailHandler))
    .addFeed("rx.ng.video", provideVideo)
    .addFeed("rx.ng.mediainfo-explorer", provideMediaInfoExplorer)
    .addFeed("rx.ng.search", provideSearch).feedMap;

export type FeedMap = ReturnType<typeof buildFeedMap>;

export type RequestTypeFor<K extends keyof FeedMap> = {
  [KEY in K]: Parameters<FeedMap[KEY]["provider"]>[1];
}[K];

export type ResponseTypeFor<K extends keyof FeedMap> = {
  [KEY in K]: ObservedValueOf<ReturnType<FeedMap[KEY]["provider"]>>;
}[K];
