import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile } from "../ws.js";

export type FileRevResult = {
  file?: NamedFile;
};

export const provideFileRev = (
  feeds: FullDatabaseFeeds,
  { rev }: { rev: string },
): Observable<FileRevResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({ file: allFiles.get(rev) })),
  );
