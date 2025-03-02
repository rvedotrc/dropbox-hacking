import * as React from "react";
import { useEffect, useState } from "react";
import { map, Observable } from "rxjs";

import logRender from "../logRender";
import { useRxFeedsViaMultiplexer } from "../context/rx/rxRecordFeedContext";
import type { ImageAndMaybeDelta } from "../context/rx/rxFeedClient";
import Navigate from "../days/navigate";

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

  if (!feeds) return "waiting for multiplexer...";

  //   const [filesWithExifCount, setFilesWithExifCount] = useState<number>();
  //   const [fileExifCountsByMonth, setFileExifCountsByMonth] =
  //     useState<Record<string, number>>();

  //     const subFilesWithExif = combineLatest([
  //       rxFeeds.file,
  //       rxFeeds.exif,
  //     ]).subscribe(([files, exifs]) => {
  //       const out: Record<string, { file: NamedFile; exif?: ExifFromHash }> = {};

  //       for (const f of Object.values(files)) {
  //         out[f.path_lower] = { file: f, exif: exifs[f.content_hash] };
  //       }

  //       setFilesWithExifCount(Object.keys(out).length);
  //     });

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

      {/* <h2>Files & Exif</h2>
        <p>Count: {filesWithExifCount ?? "?"}</p>

        <h2>File-Exif counts by month</h2>
        {JSON.stringify(fileExifCountsByMonth ?? null)} */}
    </>
  );
};

export default logRender(Stats);
