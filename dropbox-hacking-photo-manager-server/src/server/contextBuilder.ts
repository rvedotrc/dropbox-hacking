import { getDropboxClient } from "@blaahaj/dropbox-hacking-util";
import { Dropbox } from "dropbox";
import type { FullDatabaseFeeds } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

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

  const fullDatabaseFeeds: FullDatabaseFeeds = {
    exifsByContentHash: exifRxMap.observable(),
    mediaInfoByContentHash: mediaInfoRxMap.observable(),
    daysByDate: daysRxMap.observable(),
    allFilesByRev: allFilesRxMap.observable(),
    photosByContentHash: photosRxMap.observable(),
  };

  const photoRx = buildForPhotoDb(photoDbDir);

  const dayDb = new DayDb(dayDbDir);

  const close = async () => {
    exifRxMap.close();
    mediaInfoRxMap.close();
    daysRxMap.close();
    allFilesRxMap.close();
    photosRxMap.close();
  };

  return {
    port: args.port,
    baseUrlWithoutSlash: args.baseUrlWithoutSlash,
    get dropboxClient(): Promise<Dropbox> {
      return getDropboxClient();
    },

    photoRxUpdater: photoRx.update,
    photoRxTransformer: photoRx.transform,

    dayDb,

    fullDatabaseFeeds,

    close,
  };
};
