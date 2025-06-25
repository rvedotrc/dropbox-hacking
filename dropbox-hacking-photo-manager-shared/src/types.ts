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
      route: "route/next-gen/fsck";
    }
  | {
      route: "route/next-gen/list-of-days/without-samples";
    }
  | {
      route: "route/next-gen/day/files";
      date: string;
    }
  | {
      route: "route/next-gen/file/id";
      id: string;
    }
  | {
      route: "route/next-gen/file/rev";
      rev: string;
    }
  | {
      route: "route/next-gen/content-hash";
      contentHash: string;
    }
  | {
      route: "calendar";
    }
  | {
      route: "days";
    }
  | {
      route: "days-plain";
    }
  | {
      route: "day";
      date: string;
    }
  | {
      route: "month";
      month: string;
    }
  | {
      route: "year";
      year: string;
    }
  | {
      route: "photo";
      rev: string;
    };

export const ensureNever = (_: never) => undefined;

export const urlForState = (state: RouteState): string => {
  switch (state.route) {
    case "closest-to":
      return `/closest-to?degreesNorth=${state.gps.lat}&degreesEast=${state.gps.long}&n=${state.nClosest}`;
    case "day":
      return `/day/${state.date}`;
    case "days":
      return `/days/with-samples`;
    case "days-plain":
      return `/days/plain`;
    case "calendar":
      return `/days/calendar`;
    case "year":
      return `/year/${state.year}`;
    case "month":
      return `/month/${state.month}`;
    case "photo":
      return `/photo/rev/${state.rev}`;
    case "route/next-gen/basic-counts":
      return `/next-gen/basic-counts`;
    case "route/next-gen/fsck":
      return `/next-gen/fsck`;
    case "route/next-gen/content-hash":
      return `/next-gen/content-hash/${state.contentHash}`;
    case "route/next-gen/day/files":
      return `/next-gen/day/${state.date}/files`;
    case "route/next-gen/file/id":
      return `/next-gen/file/id/${state.id}`;
    case "route/next-gen/file/rev":
      return `/next-gen/file/rev/${state.rev}`;
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
