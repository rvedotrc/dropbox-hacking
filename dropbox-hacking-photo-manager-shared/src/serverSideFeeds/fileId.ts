import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile } from "../ws.js";

export type FileIdResult = {
  file?: NamedFile;
};

export const provideFileId = (
  feeds: FullDatabaseFeeds,
  { id }: { id: string },
): Observable<FileIdResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({ file: allFiles.values().find((f) => f.id === id) })),
  );
