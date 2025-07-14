import { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";

import type { GPSLatNLongE } from "./gpsLatLong.js";
import type { NamedFile } from "./ws.js";

export type DayMetadata = {
  date: string;
  description: string;
};

export type RouteState =
  | {
      route: "closest-to";
      gps: GPSLatNLongE;
      nClosest: number;
    }
  | {
      route: "route/next-gen/basic-counts";
    }
  | {
      route: "route/next-gen/tags";
      tag: string | null;
    }
  | {
      route: "route/next-gen/fsck";
    }
  | {
      route: "route/next-gen/exif-explorer";
    }
  | {
      route: "route/next-gen/list-of-days/without-samples";
    }
  | {
      route: "route/next-gen/day/files";
      date: string;
    }
  | {
      route: "route/next-gen/content-hash";
      contentHash: string;
      context?: {
        date: string;
        rev: string;
      };
    };
// RVE-add-route

export const ensureNever = (_: never) => undefined;

export const urlForState = (state: RouteState): string => {
  switch (state.route) {
    case "closest-to":
      return `/closest-to?degreesNorth=${state.gps.lat}&degreesEast=${state.gps.long}&n=${state.nClosest}`;
    case "route/next-gen/basic-counts":
      return `/next-gen/basic-counts`;
    case "route/next-gen/fsck":
      return `/next-gen/fsck`;
    case "route/next-gen/tags":
      return `/next-gen/tags${state.tag === null ? "" : `/${state.tag}`}`;
    case "route/next-gen/exif-explorer":
      return `/next-gen/exif-explorer`;
    case "route/next-gen/content-hash":
      return `/next-gen/content-hash/${state.contentHash}`;
    case "route/next-gen/day/files":
      return `/next-gen/day/${state.date}/files`;
    case "route/next-gen/list-of-days/without-samples":
      return `/next-gen/list-of-days/without-samples`;
    // RVE-add-route
  }

  ensureNever(state);
};

export type CountsByDateEntry = {
  date: string;
  count: number;
  countWithGps: number;
  samplePhotos: Photo[];
};
export type CountsByDate = CountsByDateEntry[];
export type CountsByDateResponse = { counts_by_date: CountsByDate };

export type Photo = {
  namedFile: NamedFile;
  exif: ExifFromHash;
};
export type PhotoResponse = { photo: Photo };
export type PhotosResponse = { photos: Photo[] };

export type ThumbnailsByRevEntry = { rev: string; thumbnail: string };
export type ThumbnailsByRevResponse = {
  thumbnails_by_rev: ThumbnailsByRevEntry[];
};

export type DayMetadataResponse = {
  day_metadata: DayMetadata;
};

export type DaysMetadataResponse = {
  days_metadata: DayMetadata[];
};
