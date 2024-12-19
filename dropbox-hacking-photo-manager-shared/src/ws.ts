import type { files } from "dropbox";

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
