import {
  GPSLatLong,
  type GPSLatNLongE,
} from "dropbox-hacking-photo-manager-shared";
import type { FullDatabaseFeeds } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { combineLatest } from "rxjs/internal/observable/combineLatest";
import { map } from "rxjs/operators";

export type ClosestToRequest = {
  readonly type: "rx.ng.closest-to";

  readonly from: GPSLatNLongE;
  readonly nClosest: number;
  readonly maxDistanceInMeters: number;
};

const hasGPS = <T extends { gps: GPSLatLong | null }>(
  item: T,
): item is T & { gps: GPSLatLong } => item.gps !== null;

const latLongToXYZ = (point: GPSLatNLongE): [number, number, number] => {
  const r = Math.cos((point.lat / 180) * Math.PI);
  const x = Math.cos((point.long / 180) * Math.PI) * r;
  const y = Math.sin((point.long / 180) * Math.PI) * r;
  const z = Math.sin((point.lat / 180) * Math.PI);
  return [x, y, z];
};

const distanceBetween = (
  a: [number, number, number],
  b: [number, number, number],
): number =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

const calculateDistance = (a: GPSLatLong, b: GPSLatNLongE): number =>
  distanceBetween(latLongToXYZ(a.asSigned()), latLongToXYZ(b)) * 6371000;

export const provideClosestTo = (
  feeds: FullDatabaseFeeds,
  req: ClosestToRequest,
) =>
  combineLatest([
    feeds.exifsByContentHash,
    feeds.allFilesByRev,
    feeds.photosByContentHash,
  ]).pipe(
    // FIXME rewrite using the combined feed
    map(([exif, ls, photos]) => {
      const withGPS = [...exif.entries()]
        .map(([hash, data]) => ({
          hash,
          data,
          gps: data.exifData.tags
            ? GPSLatLong.fromExifTags(data.exifData.tags)
            : null,
          photoDbEntry: photos.get(hash),
        }))
        .filter(hasGPS);

      const withDistance = withGPS
        .map((item) => ({
          ...item,
          distance: calculateDistance(item.gps, req.from),
        }))
        .sort((a, b) => a.distance - b.distance);

      const truncated = withDistance.length > req.nClosest;
      withDistance.splice(req.nClosest);

      const wantedHashes = new Set(withDistance.map((t) => t.hash));
      const wantedImages = [...ls.values()].filter((t) =>
        wantedHashes.has(t.content_hash),
      );

      const items = withDistance.flatMap((exifItem) =>
        wantedImages
          .filter((f) => f.content_hash === exifItem.hash)
          .map((namedFile) => ({
            distanceInMeters: exifItem.distance,
            photo: {
              namedFile,
              exif: exifItem.data,
            },
            photoDbEntry: exifItem.photoDbEntry,
            exif,
          })),
      );

      return {
        truncated,
        items,
      };
    }),
  );

// export const closestToHandlerBuilder = (context: Context) => {
//   return async (req: ClosestToRequest): Promise<ClosestToResponse> => {
//     const exif = await context.exifDbFeed.read();
//     const ls = await context.lsFeed.read();
//     if (ls.tag !== "ready") throw new Error("Not ready");

//     return closestToBaseHandler(exif, ls.entries, req);
//   };
// };
