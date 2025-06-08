import {
  combineLatest,
  map,
  type Observable,
  type ObservedValueOf,
} from "rxjs";

export * from "./types.js";

import {
  imageFilenamePattern,
  videoFilenamePattern,
  type FullDatabaseFeeds,
} from "./index.js";
import type { DayMetadata } from "../types.js";

export type DaySummaryWithoutSamples = {
  date: string;
  dayMetadata: DayMetadata | null;
  counts: {
    images: number;
    imagesWithExif: number;
    videos: number;
    videosWithMediaInfo: number;
  };
};

export const provideListOfDaysWithoutSamples = (
  feeds: FullDatabaseFeeds,
): Observable<DaySummaryWithoutSamples[]> =>
  combineLatest([
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
    feeds.allFilesByRev,
    feeds.daysByDate,
  ]).pipe(
    map(([exifs, mediaInfos, allFiles, days]) => {
      const out = new Map<string, DaySummaryWithoutSamples>();

      for (const [date, dayMetadata] of days.entries()) {
        out.set(date, {
          date,
          dayMetadata,
          counts: {
            images: 0,
            imagesWithExif: 0,
            videos: 0,
            videosWithMediaInfo: 0,
          },
        });
      }

      for (const file of allFiles.values()) {
        const isImage = imageFilenamePattern.test(file.path_lower);
        const isVideo = videoFilenamePattern.test(file.path_lower);
        if (!isImage && !isVideo) continue;

        const date = file.client_modified.substring(0, 10);
        const hasExif = exifs.has(file.content_hash);
        const hasMediaInfo = mediaInfos.has(file.content_hash);

        const e = out.get(date);
        if (e) {
          if (isImage) {
            ++e.counts.images;
            if (hasExif) ++e.counts.imagesWithExif;
          }

          if (isVideo) {
            ++e.counts.videos;
            if (hasMediaInfo) ++e.counts.videosWithMediaInfo;
          }
        } else {
          out.set(date, {
            date,
            dayMetadata: null,
            counts: {
              images: isImage ? 1 : 0,
              imagesWithExif: isImage && hasExif ? 1 : 0,
              videos: isVideo ? 1 : 0,
              videosWithMediaInfo: isVideo && hasMediaInfo ? 1 : 0,
            },
          });
        }
      }

      const r = [...out.values()].toSorted((a, b) =>
        a.date.localeCompare(b.date),
      );

      return r;
    }),
  );

export type NGDaysNoSamplesType = ObservedValueOf<
  ReturnType<typeof provideListOfDaysWithoutSamples>
>;
