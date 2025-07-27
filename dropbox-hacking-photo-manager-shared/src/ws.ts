import type { files } from "dropbox";

import type { Photo } from "./types.js";

export type ClosestToResponse = {
  items: {
    distanceInMeters: number;
    photo: Photo;
  }[];
  truncated: boolean;
};

export type PhotoDbEntry = {
  description?: string;
  tags?: string[];
  rotate?: number;
};

export type NamedFile = Readonly<files.FileMetadata> & {
  readonly path_lower: string;
  readonly path_display: string;
  readonly content_hash: string;
};
