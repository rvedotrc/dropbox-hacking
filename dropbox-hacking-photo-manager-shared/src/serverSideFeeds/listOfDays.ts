import {
  combineLatest,
  map,
  type Observable,
  type ObservedValueOf,
} from "rxjs";

import {
  isExifableFilename,
  isMediainfoableFilename,
  isPreviewable,
} from "../fileTypes.js";
import { GPSLatLong } from "../gpsLatLong.js";
import type { DayMetadata } from "../types.js";
import { type FullDatabaseFeeds } from "./index.js";

export type ListOfDaysRequest = {
  readonly type: "rx.ng.list-of-days";
  readonly withSamples: false;
};

const template = {
  exifableCount: 0,
  hasExifCount: 0,
  mediaInfoableCount: 0,
  hasMediaInfoCount: 0,
  previewableCount: 0,
  hasGPSCount: 0,
};

export type DaySummaryWithoutSamples = {
  date: string;
  dayMetadata: DayMetadata | null;
  counts: typeof template;
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

      const getOrCreate = (date: string) => {
        let item = out.get(date);
        if (item) return item;

        item = {
          date,
          dayMetadata: null,
          counts: { ...template },
          photoTags: {} as Record<string, number>,
        };
        out.set(date, item);
        return item;
      };

      for (const file of allFiles.values()) {
        if (!isPreviewable(file.path_lower)) continue;

        const exifData = exifs.get(file.content_hash);
        const mediaInfoData = mediaInfos.get(file.content_hash);
        const photo = photosByContentHash.get(file.content_hash);

        const date = file.client_modified.substring(0, 10);
        const item = getOrCreate(date);

        ++item.counts.previewableCount;
        let gps: GPSLatLong | null = null;

        if (isExifableFilename(file.name)) {
          ++item.counts.exifableCount;

          if (exifData) {
            ++item.counts.hasExifCount;
            gps ??= GPSLatLong.fromExif(exifData);
          }
        }

        if (isMediainfoableFilename(file.name)) {
          ++item.counts.mediaInfoableCount;

          if (mediaInfoData) {
            ++item.counts.hasMediaInfoCount;
            gps ??= GPSLatLong.fromMediaInfo(mediaInfoData);
          }
        }

        if (gps) ++item.counts.hasGPSCount;

        for (const tag of photo?.tags ?? []) {
          item.photoTags[tag] = (item.photoTags[tag] ?? 0) + 1;
        }
      }

      for (const [date, v] of days) {
        const entry = out.get(date);
        if (!entry) continue;

        entry.dayMetadata = v;
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
