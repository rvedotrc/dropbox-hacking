import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type {
  DayMetadata,
  DeltaApplier,
  NamedFile,
  PhotoDbEntry,
  RxFeedResponse,
} from "dropbox-hacking-photo-manager-shared";
import {
  expandWithImage,
  IOHandler,
  recordDeltaApplier,
} from "dropbox-hacking-photo-manager-shared";
import { map, Observable, ReplaySubject } from "rxjs";

type REQUEST = { type: string };
export type ImageAndMaybeDelta<I, D> = { image: I; delta?: D };

export const buildFromIO = (
  io: IOHandler<RxFeedResponse<unknown>, REQUEST>,
) => {
  const boundGetRxFeed = (request: REQUEST) => getRxFeed(request, io);

  const boundGetRxDeltaFeed = <I, D>(
    request: REQUEST,
    deltaApplier: DeltaApplier<I, D>,
  ): Observable<ImageAndMaybeDelta<I, D>> => {
    return boundGetRxFeed(request).pipe(map(expandWithImage(deltaApplier)));
  };

  const toReplaySubject1 = <T>(observable: Observable<T>) => {
    const subject = new ReplaySubject<T>(1);
    const subscription = observable.subscribe(subject);
    return { subject, subscription };
  };

  const days = toReplaySubject1(
    boundGetRxDeltaFeed(
      { type: "rx-days" },
      recordDeltaApplier<string, DayMetadata>(),
    ),
  );
  const exif = toReplaySubject1(
    boundGetRxDeltaFeed(
      { type: "rx-exif" },
      recordDeltaApplier<string, ExifFromHash>(),
    ),
  );
  const files = toReplaySubject1(
    boundGetRxDeltaFeed(
      { type: "rx-files" },
      recordDeltaApplier<string, NamedFile>(),
    ),
  );
  const photos = toReplaySubject1(
    boundGetRxDeltaFeed(
      { type: "rx-photos" },
      recordDeltaApplier<string, PhotoDbEntry>(),
    ),
  );

  return {
    feeds: {
      days: days.subject,
      exif: exif.subject,
      files: files.subject,
      photos: photos.subject,
    },
    close: () => {
      console.log("unsub from all");
      days.subscription.unsubscribe();
      exif.subscription.unsubscribe();
      files.subscription.unsubscribe();
      photos.subscription.unsubscribe();
    },
  };
};
