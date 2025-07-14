import { combineLatest, map, type Observable } from "rxjs";

import type { NamedFile } from "../ws.js";
import { type FullDatabaseFeeds } from "./index.js";

export type FileRevRequest = {
  readonly type: "rx.ng.file.rev";
  readonly rev: string;
};

export type FileRevResult = {
  readonly file?: NamedFile;
};

export const provideFileRev = (
  feeds: FullDatabaseFeeds,
  req: FileRevRequest,
): Observable<FileRevResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({ file: allFiles.get(req.rev) })),
  );
