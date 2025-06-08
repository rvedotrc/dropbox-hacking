import { combineLatest, map, type ObservedValueOf } from "rxjs";
import {
  imageFilenamePattern,
  videoFilenamePattern,
  type FullDatabaseFeeds,
} from "./index.js";

export const provideBasicCounts = (feeds: FullDatabaseFeeds) =>
  combineLatest([
    feeds.photosById,
    feeds.exifsByContentHash,
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.mediaInfoByContentHash,
  ]).pipe(
    map(([photos, exifs, files, days, mediaInfos]) => {
      const unusedExifs = new Map(exifs);
      const unusedMediaInfos = new Map(mediaInfos);
      const unusedPhotos = new Map(photos);
      const imageCountsByTime = new Map<string, number>();
      const videoCountsByTime = new Map<string, number>();

      for (const file of files.values()) {
        unusedExifs.delete(file.content_hash);
        unusedMediaInfos.delete(file.content_hash);
        unusedPhotos.delete(file.id);

        const timeKey = file.client_modified.substring(0, 4);

        if (imageFilenamePattern.test(file.path_lower)) {
          imageCountsByTime.set(
            timeKey,
            (imageCountsByTime.get(timeKey) ?? 0) + 1,
          );
        }

        if (videoFilenamePattern.test(file.path_lower)) {
          videoCountsByTime.set(
            timeKey,
            (videoCountsByTime.get(timeKey) ?? 0) + 1,
          );
        }
      }

      return {
        counts: {
          photos: photos.size,
          exifs: exifs.size,
          allFiles: files.size,
          days: days.size,
          unusedExifs: unusedExifs.size,
          unusedMediaInfos: unusedMediaInfos.size,
          unusedPhotos: unusedPhotos.size,
          imageCountsByTime: [...imageCountsByTime.entries()].sort((a, b) =>
            a[0].localeCompare(b[0]),
          ),
          videoCountsByTime: [...videoCountsByTime.entries()].sort((a, b) =>
            a[0].localeCompare(b[0]),
          ),
        },
      };
    }),
  );

export type BasicCountsType = ObservedValueOf<
  ReturnType<typeof provideBasicCounts>
>;
