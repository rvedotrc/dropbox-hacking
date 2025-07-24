import {
  combineLatest,
  map,
  type Observable,
  type ObservedValueOf,
} from "rxjs";

import { GPSLatLong } from "../gpsLatLong.js";
import type { DayMetadata } from "../types.js";
import {
  type FullDatabaseFeeds,
  imageFilenamePattern,
  videoFilenamePattern,
} from "./index.js";

export type ListOfDaysRequest = {
  readonly type: "rx.ng.list-of-days";
  readonly withSamples: false;
};

export type DaySummaryWithoutSamples = {
  date: string;
  dayMetadata: DayMetadata | null;
  counts: {
    imagesWithExif: number;
    videosWithMediaInfo: number;
    imagesWithGPS: number;
    videosWithGPS: number;
  };
  photoTags: Record<string, number>;
};

export const provideListOfDaysWithoutSamples = (
  feeds: FullDatabaseFeeds,
  _req: ListOfDaysRequest,
): Observable<DaySummaryWithoutSamples[]> =>
  combineLatest([
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.photosByContentHash,
  ]).pipe(
    map(([exifs, mediaInfos, allFiles, days, photosByContentHash]) => {
      const out = new Map<string, DaySummaryWithoutSamples>();

      for (const [date, dayMetadata] of days.entries()) {
        out.set(date, {
          date,
          dayMetadata,
          counts: {
            imagesWithExif: 0,
            videosWithMediaInfo: 0,
            imagesWithGPS: 0,
            videosWithGPS: 0,
          },
          photoTags: {} as Record<string, number>,
        });
      }

      for (const file of allFiles.values()) {
        const isImage = imageFilenamePattern.test(file.path_lower);
        const isVideo = videoFilenamePattern.test(file.path_lower);
        if (!isImage && !isVideo) continue;

        const exif = exifs.get(file.content_hash);
        const exifGPS = exif ? GPSLatLong.fromExif(exif) : null;
        const mediaInfo = mediaInfos.get(file.content_hash);
        const mediaInfoGPS = mediaInfo
          ? GPSLatLong.fromMediaInfo(mediaInfo)
          : null;

        const date = file.client_modified.substring(0, 10);
        const hasExif = exifs.has(file.content_hash);
        const hasMediaInfo = mediaInfos.has(file.content_hash);

        const photoDbEntry = photosByContentHash.get(file.content_hash);

        if (
          !hasExif &&
          !hasMediaInfo &&
          !photoDbEntry &&
          file.path_lower.endsWith(".cr3")
        )
          continue;

        let e = out.get(date);
        if (e) {
          if (isImage) {
            if (hasExif) ++e.counts.imagesWithExif;
            if (exifGPS) ++e.counts.imagesWithGPS;
          }

          if (isVideo) {
            if (hasMediaInfo) ++e.counts.videosWithMediaInfo;
            if (mediaInfoGPS) ++e.counts.videosWithGPS;
          }
        } else {
          e = {
            date,
            dayMetadata: null,
            counts: {
              imagesWithExif: isImage && hasExif ? 1 : 0,
              videosWithMediaInfo: isVideo && hasMediaInfo ? 1 : 0,
              imagesWithGPS: exifGPS ? 1 : 0,
              videosWithGPS: mediaInfoGPS ? 1 : 0,
            },
            photoTags: {},
          };

          out.set(date, e);
        }

        if (photoDbEntry) {
          for (const tag of photoDbEntry.tags ?? []) {
            e.photoTags[tag] = (e.photoTags[tag] ?? 0) + 1;
          }
        }
      }

      const r = [...out.values()]
        .filter(
          (item) =>
            item.counts.imagesWithExif + item.counts.videosWithMediaInfo > 0,
        )
        .toSorted((a, b) => a.date.localeCompare(b.date));

      return r;
    }),
  );

export type NGDaysNoSamplesType = ObservedValueOf<
  ReturnType<typeof provideListOfDaysWithoutSamples>
>;
