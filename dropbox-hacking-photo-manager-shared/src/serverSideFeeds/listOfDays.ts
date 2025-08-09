import {
  combineLatest,
  map,
  type Observable,
  type ObservedValueOf,
} from "rxjs";

import { isExifableFilename, isMediainfoableFilename } from "../fileTypes.js";
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
  combineLatest([feeds.byContentHash, feeds.daysByDate]).pipe(
    map(([contentMap, days]) => {
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

      for (const file of contentMap.values()) {
        const item = getOrCreate(file.date);

        ++item.counts.previewableCount;

        if (isExifableFilename(file.namedFiles[0].name)) {
          ++item.counts.exifableCount;

          if (file.exif) {
            ++item.counts.hasExifCount;
          }
        }

        if (isMediainfoableFilename(file.namedFiles[0].name)) {
          ++item.counts.mediaInfoableCount;

          if (file.mediaInfo) {
            ++item.counts.hasMediaInfoCount;
          }
        }

        if (file.gps) ++item.counts.hasGPSCount;

        for (const tag of file.photo?.tags ?? []) {
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
