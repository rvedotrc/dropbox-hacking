import { combineLatest, map, type Observable } from "rxjs";

import type { DayMetadata } from "../types.js";
import { type ContentHashCollection, type FullDatabaseFeeds } from "./index.js";

export type DayFilesRequest = {
  readonly type: "rx.ng.day.files";
  readonly date: string;
};

export type DayFilesResult = {
  readonly date: string;
  readonly dayMetadata?: DayMetadata;
  readonly files: readonly ContentHashCollection[];
};

export const provideDayFiles = (
  feeds: FullDatabaseFeeds,
  req: DayFilesRequest,
): Observable<DayFilesResult> =>
  combineLatest([
    feeds.byContentHash.pipe(
      map((m) =>
        m
          .values()
          .filter((item) => item.date === req.date)
          .toArray(),
      ),
    ),
    feeds.daysByDate.pipe(map((m) => m.get(req.date))),
  ]).pipe(
    map(([items, day]) => ({
      date: req.date,
      dayMetadata: day,
      files: items.toSorted(
        (a, b) =>
          a.timestamp.localeCompare(b.timestamp) ||
          a.contentHash.localeCompare(b.contentHash),
      ),
    })),
  );
