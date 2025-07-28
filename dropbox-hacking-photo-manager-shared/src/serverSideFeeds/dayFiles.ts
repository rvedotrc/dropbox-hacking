import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
import { combineLatest, map, type Observable } from "rxjs";

import { isPreviewable } from "../fileTypes.js";
import type { DayMetadata } from "../types.js";
import type { NamedFile, PhotoDbEntry } from "../ws.js";
import { type FullDatabaseFeeds } from "./index.js";

export type DayFilesRequest = {
  readonly type: "rx.ng.day.files";
  readonly date: string;
};

export type DayFilesResult = {
  date: string;
  dayMetadata?: DayMetadata;
  files: {
    namedFile: NamedFile;
    exif: ExifFromHash | undefined;
    mediaInfo: MediainfoFromHash | undefined;
    photoDbEntry: PhotoDbEntry | undefined;
  }[];
};

export const provideDayFiles = (
  feeds: FullDatabaseFeeds,
  req: DayFilesRequest,
): Observable<DayFilesResult> =>
  combineLatest([
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.photosByContentHash,
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
  ]).pipe(
    map(([allFiles, days, photos, exifs, medaInfos]) => {
      const dayMetadata = days.get(req.date);

      const r: DayFilesResult = {
        date: req.date,
        dayMetadata,
        files: [],
      };

      r.files = allFiles
        .values()
        .filter((f) => f.client_modified.startsWith(req.date))
        .filter((f) => isPreviewable(f.path_lower))
        .map((namedFile) => ({
          namedFile,
          exif: exifs.get(namedFile.content_hash),
          mediaInfo: medaInfos.get(namedFile.content_hash),
          photoDbEntry: photos.get(namedFile.content_hash),
        }))
        // .filter(
        //   (item) =>
        //     item.exif ||
        //     item.photoDbEntry ||
        //     item.content.mediaInfo ||
        //     item.namedFile.path_lower.match(/\.cr3$/),
        // )
        .toArray()
        .toSorted((a, b) =>
          a.namedFile.client_modified.localeCompare(
            b.namedFile.client_modified,
          ),
        );

      return r;
    }),
  );
