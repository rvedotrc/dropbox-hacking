import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import {
  imageFilenamePattern,
  videoFilenamePattern,
  type FullDatabaseFeeds,
} from "./index.js";
import type { DayMetadata } from "../types.js";
import type { NamedFile } from "../ws.js";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";

export type DayFilesImageFile = {
  namedFile: NamedFile;
  type: "image";
  exifFromHash?: ExifFromHash;
};

export type DayFilesVideoFile = {
  namedFile: NamedFile;
  type: "video";
  mediaInfoFromHash?: MediainfoFromHash;
};

export type DayFilesResult = {
  date: string;
  dayMetadata?: DayMetadata;
  files: (DayFilesImageFile | DayFilesVideoFile)[];
};

export const provideDayFiles = (
  feeds: FullDatabaseFeeds,
  { date }: { date: string },
): Observable<DayFilesResult> =>
  combineLatest([
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
  ]).pipe(
    map(([allFiles, days, exifs, medaInfos]) => {
      const dayMetadata = days.get(date);

      const r: DayFilesResult = {
        date,
        dayMetadata,
        files: [],
      };

      r.files = allFiles
        .values()
        .filter((f) => f.client_modified.startsWith(date))
        .map((namedFile): DayFilesImageFile | DayFilesVideoFile | undefined => {
          if (imageFilenamePattern.test(namedFile.path_lower)) {
            return {
              namedFile,
              type: "image",
              exifFromHash: exifs.get(namedFile.content_hash),
            };
          }

          if (videoFilenamePattern.test(namedFile.path_lower)) {
            return {
              namedFile,
              type: "video",
              mediaInfoFromHash: medaInfos.get(namedFile.content_hash),
            };
          }

          return undefined;
        })
        .filter((t) => t !== undefined)
        .toArray()
        .toSorted((a, b) =>
          a.namedFile.client_modified.localeCompare(
            b.namedFile.client_modified,
          ),
        );

      return r;
    }),
  );
