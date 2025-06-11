import { combineLatest, map, type Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";

export type TemplateResult = {
  files: number;
};

export const provideTemplate = (
  feeds: FullDatabaseFeeds,
): Observable<TemplateResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({ files: allFiles.size })),
  );
