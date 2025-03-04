import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { combineLatest, map, Observable } from "rxjs";

import logRender from "../logRender";
import { useRxFeedsViaMultiplexer } from "../context/rx/rxRecordFeedContext";
import type { ImageAndMaybeDelta } from "../context/rx/rxFeedClient";
import Navigate from "../days/navigate";
import type { ExifFromHash } from "dropbox-hacking-exif-db";
import type {
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import { useLatestValue } from "../context/rx/useLatestValue";

const Stats = () => {
  const feeds = useRxFeedsViaMultiplexer();

  const [daysCount, setDaysCount] = useState<number>();
  const [photosCount, setPhotosCount] = useState<number>();
  const [exifCount, setExifCount] = useState<number>();
  const [filesCount, setFilesCount] = useState<number>();

  const addEffect = (
    key: keyof NonNullable<typeof feeds>,
    setter: typeof setDaysCount,
  ) =>
    useEffect(() => {
      if (feeds) {
        const obs = feeds[key] as Observable<
          ImageAndMaybeDelta<Record<string, unknown>, unknown>
        >;

        const subscription = obs
          .pipe(map((v) => Object.keys(v.image).length))
          .subscribe({
            next: (count) => setter(count),
            complete: () => console.log({ complete: true }),
            error: (error: unknown) => console.error({ error }),
          });

        return () => subscription.unsubscribe();
      }
    }, [feeds]);

  addEffect("days", setDaysCount);
  addEffect("exif", setExifCount);
  addEffect("files", setFilesCount);
  addEffect("photos", setPhotosCount);

  const filesAndExifAndPhotoDb = useMemo(
    () =>
      !feeds
        ? undefined
        : // Naive full join
          combineLatest([feeds.files, feeds.exif, feeds.photos]).pipe(
            map(([f, e, p]) => {
              const out: Record<
                string,
                {
                  namedFile: NamedFile;
                  exif: ExifFromHash | undefined;
                  photoDbEntry: PhotoDbEntry | undefined;
                }
              > = {};

              for (const [id, namedFile] of Object.entries(f.image)) {
                const exif: ExifFromHash | undefined =
                  e.image[namedFile.content_hash];
                const photoDbEntry: PhotoDbEntry | undefined = p.image[id];
                out[id] = { namedFile, exif, photoDbEntry };
              }
              return out;
            }),
          ),
    [feeds],
  );

  const photosByDate = useMemo(
    () =>
      filesAndExifAndPhotoDb?.pipe(map((t) => Object.values(t))).pipe(
        map((photos) => {
          const out: Record<string, typeof photos> = {};

          for (const photo of photos) {
            const date = photo.namedFile.client_modified.substring(0, 10);
            const list = out[date];
            if (list) list.push(photo);
            else out[date] = [photo];
          }

          return out;
        }),
      ),
    [filesAndExifAndPhotoDb],
  );

  const fepLatest = useLatestValue(filesAndExifAndPhotoDb);

  const fepExtract = useMemo(
    () =>
      !fepLatest
        ? null
        : Object.entries(fepLatest)
            .toSorted((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 3),
    [fepLatest],
  );

  const pbdLatest = useLatestValue(photosByDate);

  const pbdExtract = useMemo(
    () =>
      pbdLatest
        ? Object.entries(pbdLatest)
            .toSorted((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 3)
        : null,
    [pbdLatest],
  );

  if (!feeds) return "waiting for multiplexer...";

  return (
    <>
      <Navigate />

      <h1>Stats!</h1>

      <h2>Files</h2>
      <p>Count: {filesCount ?? "?"}</p>

      <h2>Exif</h2>
      <p>Count: {exifCount ?? "?"}</p>

      <h2>Days</h2>
      <p>Count: {daysCount ?? "?"}</p>

      <h2>Photos</h2>
      <p>Count: {photosCount ?? "?"}</p>

      <h2>Here be dragons!</h2>

      <h3>File, Exif, PhotoDB</h3>
      <pre>{JSON.stringify(fepExtract, null, 2)}</pre>

      <h3>Photos by date</h3>
      <pre>{JSON.stringify(pbdExtract, null, 2)}</pre>
    </>
  );
};

export default logRender(Stats);
