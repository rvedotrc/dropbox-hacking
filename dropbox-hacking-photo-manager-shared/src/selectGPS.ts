import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";

import { GPSLatLong } from "./gpsLatLong.js";
import type { PhotoDbEntry } from "./ws.js";

export const selectGPS = (
  photo: PhotoDbEntry | null | undefined,
  exif: ExifFromHash | null | undefined,
  mediaInfo: MediainfoFromHash | null | undefined,
) =>
  (photo?.gps && GPSLatLong.fromTuple(photo.gps)) ??
  (exif && GPSLatLong.fromExif(exif)) ??
  (mediaInfo && GPSLatLong.fromMediaInfo(mediaInfo)) ??
  null;
