import { files } from "dropbox";
import { ExifFromHash } from "../../components/exif/exifDB";
import { DayMetadata } from "../server/dayDb";

export type Payload =
  | {
      route: "calendar";
    }
  | {
      route: "days";
    }
  | {
      route: "day";
      date: string;
    }
  | {
      route: "photo";
      rev: string;
    };

export type CountsByDateEntry = {
  date: string;
  count: number;
  countWithGps: number;
  samplePhotos: Photo[];
};
export type CountsByDate = CountsByDateEntry[];
export type CountsByDateResponse = { counts_by_date: CountsByDate };

export type Photo = files.FileMetadataReference & { exif: ExifFromHash };
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
