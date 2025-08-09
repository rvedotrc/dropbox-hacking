import { combineLatest, map, type Observable } from "rxjs";

import { compile } from "../search/compile.js";
import type { FilterNode } from "../search/filterNode.js";
import type { DayMetadata } from "../types.js";
import { type ContentHashCollection, type FullDatabaseFeeds } from "./index.js";

export type SearchRequest = {
  readonly type: "rx.ng.search";
  readonly filter: FilterNode;
};

export type SearchResult = {
  readonly truncated: boolean;
  readonly totalCount: number;
  readonly matches: readonly (ContentHashCollection & {
    readonly day: DayMetadata | undefined;
  })[];
};

export const provideSearch = (
  feeds: FullDatabaseFeeds,
  req: SearchRequest,
): Observable<SearchResult> => {
  const predicate = compile(req.filter);

  return combineLatest([feeds.byContentHash, feeds.daysByDate])
    .pipe(
      map(([content, days]) =>
        content
          .values()
          .map((v) => ({
            ...v,
            day: days.get(v.date),
          }))
          .toArray(),
      ),
    )
    .pipe(
      map((candidates) => {
        const matches = candidates
          .filter(predicate)
          .sort(
            (a, b) =>
              a.timestamp.localeCompare(b.timestamp) ||
              a.contentHash.localeCompare(b.contentHash),
          );

        return {
          truncated: matches.length > 1000,
          totalCount: matches.length,
          matches:
            matches.length > 1000
              ? matches.slice(matches.length - 1000)
              : matches,
        };
      }),
    );
};
