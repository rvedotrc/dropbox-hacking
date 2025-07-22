import { combineLatest, map, type ObservedValueOf } from "rxjs";

import { type FullDatabaseFeeds } from "./index.js";

const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export type MediaInfoExplorerRequest = {
  readonly type: "rx.ng.mediainfo-explorer";
  readonly streamKind: string | null;
};

export const provideMediaInfoExplorer = (
  feeds: FullDatabaseFeeds,
  req: MediaInfoExplorerRequest,
) =>
  combineLatest([feeds.mediaInfoByContentHash]).pipe(
    map(([mediaInfos]) => {
      const allTracks = mediaInfos
        .values()
        .map((m) => m.mediainfoData.media?.track)
        .flatMap((tracks) => tracks ?? [])
        .filter(
          (track) =>
            req.streamKind === null || track["@type"] === req.streamKind,
        );

      let entries = 0;
      const tagCounts = new Map<
        string,
        { present: number; nonBlank: number }
      >();

      for (const track of allTracks) {
        ++entries;

        for (const [property, value] of Object.entries(track)) {
          let v = tagCounts.get(property);
          if (v) {
            ++v.present;
            if (!isBlank(value)) ++v.nonBlank;
          } else {
            v = { present: 1, nonBlank: isBlank(value) ? 1 : 0 };
            tagCounts.set(property, v);
          }
        }
      }

      return {
        entries,
        tagCounts: [...tagCounts.entries()].map(
          ([k, v]) =>
            [
              k,
              {
                ...v,
                presentPercent: (v.present / entries) * 100.0,
                nonBlankPercentOfAll: (v.nonBlank / entries) * 100.0,
                nonBlankPercentOfPresent: (v.nonBlank / v.present) * 100.0,
              },
            ] as const,
        ),
      };
    }),
  );

export type MediaInfoExplorerType = ObservedValueOf<
  ReturnType<typeof provideMediaInfoExplorer>
>;
