import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type {
  CountsByDateEntry,
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { map } from "rxjs";

import type { buildFilesAndExifAndPhotoDb } from "./buildFilesAndExifAndPhotoDb";

const sample = <T>(items: readonly T[]): T[] => {
  if (items.length === 0) return [];

  const writeableItems = [...items];
  let n = Math.ceil(Math.log(writeableItems.length) / Math.log(2.0));
  if (n < 1) n = 1;

  return [...new Array(n).keys()].map(() => {
    const i = Math.floor(Math.random() * writeableItems.length);
    return writeableItems.splice(i, 1)[0];
  });
};

const buildCountsForDate = (
  date: string,
  photos: {
    namedFile: NamedFile;
    exif: ExifFromHash;
    photoDbEntry: PhotoDbEntry | undefined;
  }[],
): CountsByDateEntry & { photos: typeof photos } => {
  return {
    date,
    count: photos.length,
    countWithGps: photos.filter(
      (t) =>
        t.exif?.exifData?.tags?.GPSLatitude &&
        t.exif?.exifData?.tags?.GPSLongitude,
    ).length,
    samplePhotos: sample(photos).map((p) => ({ ...p, file: p.namedFile })),
    photos,
  };
};

export const buildCountsByDate = (
  filesAndExifAndPhotoDb: ReturnType<typeof buildFilesAndExifAndPhotoDb>,
) =>
  filesAndExifAndPhotoDb
    .pipe(map((t) => Object.values(t)))
    .pipe(
      map((photos) => {
        const out: Record<string, typeof photos> = {};

        for (const photo of photos) {
          const date = photo.namedFile.client_modified.substring(0, 10);
          const list = out[date];
          if (list) list.push(photo);
          else out[date] = [photo];
        }

        return out;
      }),
    )
    .pipe(
      map((record) =>
        Object.entries(record)
          .map(([date, photos]) => buildCountsForDate(date, photos))
          .toSorted((a, b) => a.date.localeCompare(b.date)),
      ),
    );
