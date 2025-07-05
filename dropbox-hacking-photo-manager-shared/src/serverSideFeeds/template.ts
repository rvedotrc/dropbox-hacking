import { combineLatest, map, type Observable } from "rxjs";

import { type FullDatabaseFeeds } from "./index.js";

export type TemplateRequest = {
  readonly type: "rx.ng.template";
  readonly files: number;
};

export type TemplateResult = {
  readonly files: number;
};

export const provideTemplate = (
  feeds: FullDatabaseFeeds,
  _req: TemplateRequest,
): Observable<TemplateResult> =>
  combineLatest([feeds.allFilesByRev]).pipe(
    map(([allFiles]) => ({ files: allFiles.size })),
  );
