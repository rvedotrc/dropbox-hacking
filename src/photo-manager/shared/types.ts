import { files } from "dropbox";
import { ExifFromHash } from "../../components/exif/exifDB";

export type CountsByDateEntry = { date: string; count: number };
export type CountsByDate = CountsByDateEntry[];

export type Photo = files.FileMetadataReference & { exif: ExifFromHash };
