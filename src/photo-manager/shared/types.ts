import { files } from "dropbox";
import { ExifFromHash } from "../../components/exif/exifDB";
import { DayMetadata } from "../server/dayDb";

export type CountsByDateEntry = { date: string; count: number };
export type CountsByDate = CountsByDateEntry[];

export type Photo = files.FileMetadataReference & { exif: ExifFromHash };

export type ThumbnailsByRevEntry = { rev: string; thumbnail: string };
export type ThumbnailsByRev = { thumbnails_by_rev: ThumbnailsByRevEntry[] };

export type DayMetadataResponse = {
  day_metadata: DayMetadata;
};
