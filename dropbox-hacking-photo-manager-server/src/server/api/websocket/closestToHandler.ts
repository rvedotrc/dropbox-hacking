import {
  GPSLatLong,
  type ClosestToRequest,
  type ClosestToResponse,
  type GPSLatNLongE,
  type NamedFile,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context.js";

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

export const closestToHandlerBuilder = (context: Context) => {
  return async (req: ClosestToRequest): Promise<ClosestToResponse> => {
    console.debug({ req });

    const exif = await context.exifDbFeed.read();
    const ls = await context.lsFeed.read();
    if (ls.tag !== "ready") throw new Error("Not ready");

    const withGPS = [...exif.entries()]
      .map(([hash, data]) => ({
        hash,
        data,
        gps: data.exifData.tags
          ? GPSLatLong.fromExifTags(data.exifData.tags)
          : null,
      }))
      .filter(hasGPS);

    console.debug(38, withGPS.length);

    const withDistance = withGPS
      .map((item) => ({
        ...item,
        distance: calculateDistance(item.gps, req.from),
      }))
      .sort((a, b) => a.distance - b.distance);

    const truncated = withDistance.length > req.nClosest;
    withDistance.splice(req.nClosest);

    console.debug({ truncated, n: withDistance.length });

    const wantedHashes = new Set(withDistance.map((t) => t.hash));
    const wantedImages = [...ls.entries.values()]
      .flat()
      .filter((t) => t[".tag"] === "file")
      .filter((t) => wantedHashes.has(t.content_hash ?? ""));

    const items = withDistance.flatMap((exifItem) =>
      wantedImages
        .filter((f) => f.content_hash === exifItem.hash)
        .map((namedFile) => ({
          distanceInMeters: exifItem.distance,
          photo: {
            namedFile: namedFile as NamedFile,
            exif: exifItem.data,
          },
          exif,
        })),
    );

    console.debug({ n: items.length });

    return {
      truncated,
      items,
    };
  };
};
