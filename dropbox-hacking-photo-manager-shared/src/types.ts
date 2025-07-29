import { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";

import type { NamedFile } from "./ws.js";

export type DayMetadata = {
  date: string;
  description: string;
};

export type Photo = {
  namedFile: NamedFile;
  exif: ExifFromHash;
};

export type DayMetadataResponse = {
  day_metadata: DayMetadata;
};
