import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile } from "../ws.js";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";

export type ContentHashResult = {
  readonly namedFiles: readonly NamedFile[];
  readonly exif: ExifFromHash | null;
  readonly mediainfo: MediainfoFromHash | null;
};

export const provideContentHash = (
  feeds: FullDatabaseFeeds,
  { contentHash }: { contentHash: string },
): Observable<ContentHashResult> =>
  combineLatest([
    feeds.allFilesByRev.pipe(
      map((allFiles) =>
        allFiles
          .values()
          .filter((f) => f.content_hash === contentHash)
          .toArray()
          .toSorted((a, b) =>
            a.client_modified.localeCompare(b.client_modified),
          ),
      ),
    ),
    feeds.exifsByContentHash.pipe(map((db) => db.get(contentHash) ?? null)),
    feeds.mediaInfoByContentHash.pipe(map((db) => db.get(contentHash) ?? null)),
  ]).pipe(
    map(([namedFiles, exif, mediainfo]) => ({
      namedFiles,
      exif,
      mediainfo,
    })),
  );
