import { isGeneralTrack } from "@blaahaj/dropbox-hacking-mediainfo-db";
import { getDropboxClient } from "@blaahaj/dropbox-hacking-util";
import { Dropbox } from "dropbox";
import {
  type NamedFile,
  selectGPS,
} from "dropbox-hacking-photo-manager-shared";
import { isPreviewable } from "dropbox-hacking-photo-manager-shared/fileTypes";
import type { FullDatabaseFeeds } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import type { Observable } from "rxjs";
import { combineLatest } from "rxjs/internal/observable/combineLatest";
import { ReplaySubject } from "rxjs/internal/ReplaySubject";
import { map } from "rxjs/operators";

import { fsCachingThumbnailFetcher } from "./api/websocket/fsCachingThumbnailFetcher.js";
import {
  batchingThumbnailFetcher,
  nullThumbnailFetcher,
} from "./api/websocket/thumbnailFetcher.js";
import { Context } from "./context.js";
import DayDb from "./dayDb.js";
import { buildForDayDbMap } from "./rx/dayDb.js";
import { buildForExifDbMap } from "./rx/exifDb.js";
import { buildForLsCacheMapAllFiles } from "./rx/lsCache.js";
import { buildForMediaInfoDbMap } from "./rx/mediaInfoDb.js";
import { buildForPhotoDb, buildForPhotoDbMap } from "./rx/photoDb.js";

export default (args: {
  port: number;
  baseUrlWithoutSlash: string;
}): Context => {
  const exifDbDir = process.env.EXIF_DB_DIR;
  if (exifDbDir === undefined) throw new Error("Need EXIF_DB_DIR");

  const mediaInfoDbDir = process.env.MEDIAINFO_DB_DIR;
  if (mediaInfoDbDir === undefined) throw new Error("Need MEDIAINFO_DB_DIR");

  const lsCacheDir = process.env.LS_CACHE_DIR;
  if (lsCacheDir === undefined) throw new Error("Need LS_CACHE_DIR");

  const dayDbDir = process.env.DAY_DB_DIR;
  if (dayDbDir === undefined) throw new Error("Need DAY_DB_DIR");

  const photoDbDir = process.env.PHOTO_DB_DIR;
  if (photoDbDir === undefined) throw new Error("Need PHOTO_DB_DIR");

  // RX

  const exifRxMap = buildForExifDbMap(exifDbDir);
  const mediaInfoRxMap = buildForMediaInfoDbMap(mediaInfoDbDir);
  const daysRxMap = buildForDayDbMap(dayDbDir);
  const allFilesRxMap = buildForLsCacheMapAllFiles(lsCacheDir);
  const photosRxMap = buildForPhotoDbMap(photoDbDir);

  const wrapAsReplay = <T>(obs: Observable<T>) => {
    const replay = new ReplaySubject<T>(1);
    const subscription = obs.subscribe(replay);
    return {
      observable: () => replay.asObservable(),
      close: () => subscription.unsubscribe(),
    };
  };

  const interestingFilesByRev = wrapAsReplay(
    allFilesRxMap
      .observable()
      .pipe(
        map(
          (t) =>
            new Map(
              t.entries().filter(([_, v]) => isPreviewable(v.path_lower)),
            ) as ReadonlyMap<string, NamedFile>,
        ),
      ),
  );

  const interestingFilesByContentHash = wrapAsReplay(
    interestingFilesByRev.observable().pipe(
      map((t) => {
        const out = new Map<string, NamedFile[]>();

        for (const namedFile of t.values()) {
          const list = out.get(namedFile.content_hash);
          if (list) list.push(namedFile);
          else out.set(namedFile.content_hash, [namedFile]);
        }

        for (const list of out.values()) {
          list.sort((a, b) => a.path_lower.localeCompare(b.path_lower));
        }

        return out as ReadonlyMap<string, readonly NamedFile[]>;
      }),
    ),
  );

  const byContentHash = wrapAsReplay(
    combineLatest([
      interestingFilesByContentHash.observable(),
      exifRxMap.observable(),
      mediaInfoRxMap.observable(),
      photosRxMap.observable(),
    ]).pipe(
      map(
        ([files, exifs, medaInfos, photos]) =>
          new Map(
            files.entries().map(([k, v]) => {
              const out = {
                namedFiles: v,
                exif: exifs.get(k) ?? null,
                mediaInfo: medaInfos.get(k) ?? null,
                photo: photos.get(k) ?? null,
              };

              const d =
                out.mediaInfo?.mediainfoData.media?.track.find(
                  isGeneralTrack,
                )?.Duration;

              return [
                k,
                {
                  contentHash: k,
                  ...out,
                  gps: selectGPS(out.photo, out.exif, out.mediaInfo),
                  duration: typeof d === "string" ? Number(d) : null,
                  timestamp: out.namedFiles[0].client_modified,
                  date: out.namedFiles[0].client_modified.substring(0, 10),
                },
              ] as const;
            }),
          ),
      ),
    ),
  );

  const fullDatabaseFeeds: FullDatabaseFeeds = {
    exifsByContentHash: exifRxMap.observable(),
    mediaInfoByContentHash: mediaInfoRxMap.observable(),
    daysByDate: daysRxMap.observable(),
    allFilesByRev: allFilesRxMap.observable(),
    photosByContentHash: photosRxMap.observable(),
    byContentHash: byContentHash.observable(),
  };

  const photoRx = buildForPhotoDb(photoDbDir);

  const dayDb = new DayDb(dayDbDir);

  const close = async () => {
    exifRxMap.close();
    mediaInfoRxMap.close();
    daysRxMap.close();
    allFilesRxMap.close();
    photosRxMap.close();
    interestingFilesByRev.close();
    interestingFilesByContentHash.close();
    byContentHash.close();
  };

  const context = {
    port: args.port,
    baseUrlWithoutSlash: args.baseUrlWithoutSlash,
    get dropboxClient(): Promise<Dropbox> {
      return getDropboxClient();
    },

    photoRxUpdater: photoRx.update,
    photoRxTransformer: photoRx.transform,

    dayDb,

    fullDatabaseFeeds,
    thumbnailFetcher: nullThumbnailFetcher(),

    close,
  };

  return {
    ...context,
    thumbnailFetcher: fsCachingThumbnailFetcher(
      context,
      batchingThumbnailFetcher(context),
    ),
  };
};
