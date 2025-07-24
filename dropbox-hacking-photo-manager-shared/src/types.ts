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
    }
  | {
      route: "route/next-gen/fsck";
    }
  | {
      route: "route/next-gen/video";
    }
  | {
      route: "route/next-gen/exif-explorer";
    }
  | {
      route: "route/next-gen/mediainfo-explorer";
      streamKind: string | null;
    }
  | {
      route: "route/next-gen/list-of-days/without-samples";
    }
  | {
      route: "route/next-gen/day/files";
      date: string;
    }
  | {
      route: "route/next-gen/search";
      filterText?: string;
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

export const ensureNever = (_: never) => {
  throw new Error("ensureNever failed");
};

export const urlForState = (state: RouteState): string => {
  switch (state.route) {
    case "closest-to":
      return `/closest-to?degreesNorth=${state.gps.lat}&degreesEast=${state.gps.long}&n=${state.nClosest}`;
    case "route/next-gen/basic-counts":
      return `/next-gen/basic-counts`;
    case "route/next-gen/fsck":
      return `/next-gen/fsck`;
    case "route/next-gen/search":
      return `/next-gen/search`;
    case "route/next-gen/video":
      return `/next-gen/video`;
    case "route/next-gen/tags":
      return `/next-gen/tags`;
    case "route/next-gen/exif-explorer":
      return `/next-gen/exif-explorer`;
    case "route/next-gen/mediainfo-explorer":
      return `/next-gen/mediainfo-explorer/${state.streamKind}`;
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

export type Photo = {
  namedFile: NamedFile;
  exif: ExifFromHash;
};

export type DayMetadataResponse = {
  day_metadata: DayMetadata;
};
