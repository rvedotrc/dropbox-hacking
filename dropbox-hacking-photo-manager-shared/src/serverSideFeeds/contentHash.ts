import { combineLatest, map, type Observable } from "rxjs";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile, PhotoDbEntry } from "../ws.js";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";

export type ContentHashRequest = {
  readonly type: "rx.ng.content_hash";
  readonly contentHash: string;
};

export type ContentHashResult = {
  readonly namedFiles: readonly NamedFile[];
  readonly exif: ExifFromHash | null;
  readonly mediainfo: MediainfoFromHash | null;
  readonly photoDbEntry: PhotoDbEntry;
};

export const provideContentHash = (
  feeds: FullDatabaseFeeds,
  req: ContentHashRequest,
): Observable<ContentHashResult> =>
  combineLatest([
    feeds.allFilesByRev.pipe(
      map((allFiles) =>
        allFiles
          .values()
          .filter((f) => f.content_hash === req.contentHash)
          .toArray()
          .toSorted((a, b) =>
            a.client_modified.localeCompare(b.client_modified),
          ),
      ),
    ),
    feeds.exifsByContentHash.pipe(map((db) => db.get(req.contentHash) ?? null)),
    feeds.mediaInfoByContentHash.pipe(
      map((db) => db.get(req.contentHash) ?? null),
    ),
    feeds.photosByContentHash.pipe(
      map((db) => db.get(req.contentHash) ?? null),
    ),
  ]).pipe(
    map(([namedFiles, exif, mediainfo, photoDbEntry]) => ({
      namedFiles,
      exif,
      mediainfo,
      photoDbEntry: photoDbEntry ?? { description: "", tags: [] },
    })),
  );
