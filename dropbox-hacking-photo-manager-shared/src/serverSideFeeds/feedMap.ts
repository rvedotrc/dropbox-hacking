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

const createSpec = <
  NAME extends string,
  REQ extends { readonly type: NAME },
  RES,
>(
  name: NAME,
  provider: Provider<REQ, RES>,
): SPEC<NAME, REQ, RES> => ({
  name,
  provider,
});

const addFeed = <
  NAME extends string,
  REQ extends { readonly type: NAME },
  RES,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BASE extends { [K in string]: any },
>(
  base: BASE,
  spec: NAME extends keyof BASE ? never : SPEC<NAME, REQ, RES>,
) =>
  ({
    ...base,
    [spec.name]: spec,
  }) as BASE & Record<NAME, typeof spec>;

export const buildFeedMap = (
  thumbnailHandler: (req: ThumbnailRequest) => Promise<ThumbnailResponse>,
) => {
  const f0: Record<never, never> = {};
  const f1 = addFeed(f0, createSpec("rx.ng.basic-counts", provideBasicCounts));
  const f2 = addFeed(f1, createSpec("rx.ng.closest-to", provideClosestTo));
  const f3 = addFeed(f2, createSpec("rx.ng.content_hash", provideContentHash));
  const f4 = addFeed(f3, createSpec("rx.ng.day.files", provideDayFiles));
  const f5 = addFeed(
    f4,
    createSpec("rx.ng.exif-explorer", provideExifExplorer),
  );
  const f6 = addFeed(f5, createSpec("rx.ng.file.id", provideFileId));
  const f7 = addFeed(f6, createSpec("rx.ng.file.rev", provideFileRev));
  const f8 = addFeed(f7, createSpec("rx.ng.fsck", provideFsck));
  const f9 = addFeed(
    f8,
    createSpec("rx.ng.list-of-days", provideListOfDaysWithoutSamples),
  );
  const f10 = addFeed(f9, createSpec("rx.ng.tags", provideTags));
  const f11 = addFeed(
    f10,
    createSpec("rx.ng.thumbnail2", provideThumbnail(thumbnailHandler)),
  );
  const f12 = addFeed(f11, createSpec("rx.ng.video", provideVideo));
  const f13 = addFeed(
    f12,
    createSpec("rx.ng.mediainfo-explorer", provideMediaInfoExplorer),
  );
  const f14 = addFeed(f13, createSpec("rx.ng.search", provideSearch));
  // RVE-add-feed

  return f14;
};

export type FeedMap = ReturnType<typeof buildFeedMap>;

export type RequestTypeFor<K extends keyof FeedMap> = {
  [KEY in K]: Parameters<FeedMap[KEY]["provider"]>[1];
}[K];

export type ResponseTypeFor<K extends keyof FeedMap> = {
  [KEY in K]: ObservedValueOf<ReturnType<FeedMap[KEY]["provider"]>>;
}[K];
