import { combineLatest, map, type ObservedValueOf } from "rxjs";
import type { FullDatabaseFeeds } from "./index.js";

export type TagsRequest = {
  readonly type: "rx.ng.tags";
};

export const provideTags = (feeds: FullDatabaseFeeds, _req: TagsRequest) =>
  combineLatest([feeds.photosByContentHash, feeds.allFilesByRev]).pipe(
    map(([photos, files]) => {
      const contentHashes = new Set(files.values().map((f) => f.content_hash));

      const tags = new Map<string, number>();

      for (const [contentHash, photoDbEntry] of photos) {
        if (contentHashes.has(contentHash)) {
          for (const tag of photoDbEntry.tags ?? []) {
            tags.set(tag, (tags.get(tag) ?? 0) + 1);
          }
        }
      }

      return {
        tags: [...tags.entries()].toSorted(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        ),
      };
    }),
  );

export type TagsType = ObservedValueOf<ReturnType<typeof provideTags>>;
