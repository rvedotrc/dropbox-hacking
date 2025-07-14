import { extname } from "node:path";

import { combineLatest, map, type ObservedValueOf } from "rxjs";

import {
  type FullDatabaseFeeds,
  imageFilenamePattern,
  videoFilenamePattern,
} from "./index.js";

// https://en.wikipedia.org/wiki/Exif
const exifableFileExtensions = [
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "wav",
  "png",
  "webp",
];

const isExifableFilename = (name: string) =>
  exifableFileExtensions.includes(
    extname(name).toLocaleLowerCase().substring(1),
  );

// https://mediaarea.net/en/MediaInfo/Support/Formats
const mediainfoFileExtensions = [
  "ac3",
  "aifc",
  "aiff",
  "ape",
  "asf",
  "au",
  "avi",
  "avr",
  "dat",
  "dts",
  "flac",
  "iff",
  "ifo",
  "irca",
  "m1v",
  "m2v",
  "mac",
  "mat",
  "mka",
  "mks",
  "mkv",
  "mov",
  "mp2",
  "mp3",
  "mp4",
  "mpeg",
  "mpg",
  "mpgv",
  "mpv",
  "ogg",
  "ogm",
  "paf",
  "pvf",
  "qt",
  "ra",
  "rm",
  "rmvb",
  "sd2",
  "sds",
  "vob",
  "w64",
  "wav",
  "wma",
  "wmv",
  "xi",
  "aac",
];

const isMediainfoableFilename = (name: string) =>
  mediainfoFileExtensions.includes(
    extname(name).toLocaleLowerCase().substring(1),
  );

const areUnique = (things: Iterable<string>): boolean => {
  const seen = {} as Record<string, true>;

  for (const thing of things) {
    if (thing in seen) return false;

    seen[thing] = true;
  }

  return true;
};

export type FsckRequest = { readonly type: "rx.ng.fsck" };

export const provideFsck = (feeds: FullDatabaseFeeds, _req: FsckRequest) =>
  combineLatest([
    feeds.photosByContentHash,
    feeds.exifsByContentHash,
    feeds.allFilesByRev,
    feeds.daysByDate,
    feeds.mediaInfoByContentHash,
  ]).pipe(
    map(([photos, exifs, files, days, mediaInfos]) => {
      if (process.env.NEVER) console.log([photos, exifs, days, mediaInfos]);

      const imageFiles = files
        .values()
        .filter((f) => imageFilenamePattern.test(f.path_lower))
        .toArray();

      const videoFiles = files
        .values()
        .filter((f) => videoFilenamePattern.test(f.path_lower))
        .toArray();

      const filesLackingExif = files
        .values()
        .filter(
          (f) => isExifableFilename(f.path_lower) && !exifs.has(f.content_hash),
        )
        .toArray();

      const filesLackingMediaInfo = files
        .values()
        .filter(
          (f) =>
            isMediainfoableFilename(f.path_lower) &&
            !mediaInfos.has(f.content_hash),
        )
        .toArray();

      const seenFileHashes = new Set(files.values().map((f) => f.content_hash));

      return {
        files: {
          count: files.size,
          fileIdsAreUnique: areUnique(files.values().map((f) => f.id)),
          fileRevsAreUnique: areUnique(files.values().map((f) => f.rev)),
        },
        exifs: {
          filesLackingExif: {
            count: filesLackingExif.length,
          },
          orphaned: exifs
            .keys()
            .filter((hash) => !seenFileHashes.has(hash))
            .toArray().length,
        },
        mediaInfo: {
          filesLackingMediaInfo: {
            count: filesLackingMediaInfo.length,
          },
          orphaned: mediaInfos
            .keys()
            .filter((hash) => !seenFileHashes.has(hash))
            .toArray().length,
        },
        imageFiles: {
          count: imageFiles.length,
          countWithExif: imageFiles.filter((f) => exifs.has(f.content_hash))
            .length,
          // imageFilesWithoutExif,
        },
        videoFiles: {
          count: videoFiles.length,
          countWithMediaInfo: videoFiles.filter((f) =>
            mediaInfos.has(f.content_hash),
          ).length,
          countWithGeneralTrack: videoFiles.filter((f) =>
            mediaInfos
              .get(f.content_hash)
              ?.mediainfoData.media?.track.some(
                (t) => t["@type"] === "General",
              ),
          ).length,
          countWithVideoTrack: videoFiles.filter((f) =>
            mediaInfos
              .get(f.content_hash)
              ?.mediainfoData.media?.track.some((t) => t["@type"] === "Video"),
          ).length,
          countWithAudioTrack: videoFiles.filter((f) =>
            mediaInfos
              .get(f.content_hash)
              ?.mediainfoData.media?.track.some((t) => t["@type"] === "Audio"),
          ).length,
        },
      };
    }),
  );

export type FsckType = ObservedValueOf<ReturnType<typeof provideFsck>>;
