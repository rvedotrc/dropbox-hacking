import type { files } from "dropbox";
import type { GPSLatNLongE } from "./gpsLatLong.js";
import type { Photo } from "./types.js";

export type SimpleRequest<T> = {
  type: "simpleRequest";
  id: string;
  payload: T;
};

export type SimpleResponse<T> = {
  type: "simpleResponse";
  id: string;
  payload: T;
};

export type PingRequest = {
  verb: "ping";
};

export type PingResponse = {
  answer: "pong";
};

export type ThumbnailRequest = {
  verb: "getThumbnail";
  rev: string;
  size: files.ThumbnailSize;
};

export type ThumbnailResponse = {
  thumbnail: string | null;
};

export type ClosestToRequest = {
  verb: "closestTo";
  from: GPSLatNLongE;
  nClosest: number;
  maxDistanceInMeters: number;
};

export type ClosestToResponse = {
  items: {
    distanceInMeters: number;
    photo: Photo;
  }[];
  truncated: boolean;
};

export type PhotoDbEntry = {
  tags: string[];
};

export type NamedFile = files.FileMetadata & {
  path_lower: string;
  path_display: string;
  content_hash: string;
};
