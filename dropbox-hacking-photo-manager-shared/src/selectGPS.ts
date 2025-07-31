import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db/types";

import { GPSLatLong } from "./gpsLatLong.js";
import type { PhotoDbEntry } from "./ws.js";

export type GPSInformation = ReturnType<typeof selectGPS>;

export const selectGPS = (
  photo: PhotoDbEntry | null | undefined,
  exif: ExifFromHash | null | undefined,
  mediaInfo: MediainfoFromHash | null | undefined,
) => {
  const fromOverride = photo?.gps
    ? GPSLatLong.fromTuple(photo.gps).asSigned()
    : null;
  const fromContent = exif
    ? GPSLatLong.fromExif(exif)?.asSigned()
    : mediaInfo
      ? GPSLatLong.fromMediaInfo(mediaInfo)?.asSigned()
      : null;

  return {
    effective: fromOverride ?? fromContent ?? null,
    fromOverride: fromOverride ?? null,
    fromContent: fromContent ?? null,
  } as const;
};
