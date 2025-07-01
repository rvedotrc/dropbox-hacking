import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { map, Observable } from "rxjs";

import logRender from "@/logRender";
import { useRxFeedsViaMultiplexer } from "@/context/rx/rxRecordFeedContext";
import type { ImageAndMaybeDelta } from "@/context/rx/rxFeedClient";
import Navigate from "@/components/navigate";
import { useLatestValue } from "@/context/rx/useLatestValue";
import { useAdditionalFeeds } from "@/context/rx/additionalFeeds";

const Stats = () => {
  const feeds = useRxFeedsViaMultiplexer();
  const moreFeeds = useAdditionalFeeds();

  const [daysCount, setDaysCount] = useState<number>();
  const [photosCount, setPhotosCount] = useState<number>();
  const [exifCount, setExifCount] = useState<number>();
  const [filesCount, setFilesCount] = useState<number>();

  const cbdLatest = useLatestValue(moreFeeds?.countsByDate);
  const fepLatest = useLatestValue(moreFeeds?.filesAndExifAndPhotoDb);

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

  // const fepLatest = useLatestValue(filesAndExifAndPhotoDb);

  const fepExtract = useMemo(
    () =>
      !fepLatest
        ? null
        : Object.entries(fepLatest)
            .toSorted((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 3),
    [fepLatest],
  );

  // const cbdLatest = useLatestValue(countsByDate);

  const cbdExtract = useMemo(
    () => (cbdLatest ? cbdLatest.slice(cbdLatest.length - 3) : null),
    [cbdLatest],
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

      <h3>Counts by date (enhanced)</h3>
      <pre>{JSON.stringify(cbdExtract, null, 2)}</pre>
    </>
  );
};

export default logRender(Stats);
