import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type { buildFromIO } from "@lib/legacyRxFeeds/rxFeedClient";
import type {
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { combineLatest, map } from "rxjs";

export const buildFilesAndExifAndPhotoDb = (
  feeds: ReturnType<typeof buildFromIO>["feeds"],
) =>
  combineLatest([feeds.files, feeds.exif, feeds.photos]).pipe(
    map(([f, e, p]) => {
      const out: Record<
        string,
        {
          namedFile: NamedFile;
          exif: ExifFromHash;
          photoDbEntry: PhotoDbEntry | undefined;
        }
      > = {};

      for (const [id, namedFile] of Object.entries(f.image)) {
        const exif: ExifFromHash | undefined = e.image[namedFile.content_hash];
        if (!exif) continue;

        const photoDbEntry: PhotoDbEntry | undefined = p.image[namedFile.rev];
        out[id] = { namedFile, exif, photoDbEntry };
      }
      return out;
    }),
  );
