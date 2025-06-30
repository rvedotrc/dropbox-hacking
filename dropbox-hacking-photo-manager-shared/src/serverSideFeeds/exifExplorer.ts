import { combineLatest, map, type ObservedValueOf } from "rxjs";
import { type FullDatabaseFeeds } from "./index.js";

const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export const provideExifExplorer = (feeds: FullDatabaseFeeds) =>
  combineLatest([feeds.exifsByContentHash]).pipe(
    map(([exifs]) => {
      let entries = 0;
      let hasImageSize = 0;
      const tagCounts = new Map<
        string,
        { present: number; nonBlank: number }
      >();

      for (const exifFromHash of exifs.values()) {
        const { exifData } = exifFromHash;
        const { imageSize, tags } = exifData;

        ++entries;
        if (imageSize) ++hasImageSize;

        if (tags) {
          for (const [property, value] of Object.entries(tags)) {
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
      }

      return {
        entries,
        hasImageSize,
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

export type ExifExplorerType = ObservedValueOf<
  ReturnType<typeof provideExifExplorer>
>;
