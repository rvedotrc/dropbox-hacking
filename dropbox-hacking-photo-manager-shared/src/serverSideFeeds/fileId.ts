import { combineLatest, map, type Observable } from "rxjs";

import { type FullDatabaseFeeds } from "./index.js";
import type { NamedFile } from "../ws.js";

export type FileIdRequest = {
  readonly type: "rx.ng.file.id";
  readonly id: string;
};

export type FileIdResult = {
  readonly file?: NamedFile;
};

export const provideFileId = (
  feeds: FullDatabaseFeeds,
  req: FileIdRequest,
): Observable<FileIdResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({
      file: allFiles.values().find((f) => f.id === req.id),
    })),
  );
