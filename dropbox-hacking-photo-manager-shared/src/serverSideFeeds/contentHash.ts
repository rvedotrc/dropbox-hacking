import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile } from "../ws.js";

export type ContentHashResult = {
  files: NamedFile[];
};

export const provideContentHash = (
  feeds: FullDatabaseFeeds,
  { contentHash }: { contentHash: string },
): Observable<ContentHashResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({
      files: allFiles
        .values()
        .filter((f) => f.content_hash === contentHash)
        .toArray()
        .toSorted((a, b) => a.client_modified.localeCompare(b.client_modified)),
    })),
  );
