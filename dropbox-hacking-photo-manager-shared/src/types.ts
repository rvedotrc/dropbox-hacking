import { files } from "dropbox";
import { ExifFromHash } from "dropbox-hacking-exif-db";
import FileMetadataReference = files.FileMetadataReference;
import FolderMetadataReference = files.FolderMetadataReference;

export type DayMetadata = {
  date: string;
  description: string;
};

export type Payload =
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

export type LsResponse = {
  items: Array<FileMetadataReference | FolderMetadataReference>;
};
