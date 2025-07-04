import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { DayMetadata } from "../types.js";
import type { NamedFile, PhotoDbEntry } from "../ws.js";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";

export type DayFilesResult = {
  date: string;
  dayMetadata?: DayMetadata;
  files: {
    namedFile: NamedFile;
    exif: ExifFromHash | undefined;
    photoDbEntry?: PhotoDbEntry;
    content: {
      exif?: ExifFromHash;
      mediaInfo?: MediainfoFromHash;
    };
  }[];
};

export const provideDayFiles = (
  feeds: FullDatabaseFeeds,
  { date }: { date: string },
): Observable<DayFilesResult> =>
  combineLatest([
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.photosByContentHash,
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
  ]).pipe(
    map(([allFiles, days, photos, exifs, medaInfos]) => {
      const dayMetadata = days.get(date);

      const r: DayFilesResult = {
        date,
        dayMetadata,
        files: [],
      };

      r.files = allFiles
        .values()
        .filter((f) => f.client_modified.startsWith(date))
        .map((namedFile) => ({
          namedFile,
          exif: exifs.get(namedFile.content_hash),
          photoDbEntry: photos.get(namedFile.content_hash),
          content: {
            exif: exifs.get(namedFile.content_hash),
            mediaInfo: medaInfos.get(namedFile.content_hash),
          },
        }))
        .toArray()
        .toSorted((a, b) =>
          a.namedFile.client_modified.localeCompare(
            b.namedFile.client_modified,
          ),
        );

      return r;
    }),
  );
