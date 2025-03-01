import { ReplaySubject } from "rxjs";
import { jsonFileObservable } from "./util.js";
import type { PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";

export type PhotoDb = Record<string, PhotoDbEntry>;

export const buildForPhotoDb = (path: string) => {
  const dbObservable = jsonFileObservable<PhotoDb>(`${path}/photos.json`, 100);

  const dbReplaySubject = new ReplaySubject<Record<string, PhotoDbEntry>>(1);
  const dbReplaySubscription = dbObservable.subscribe(dbReplaySubject);

  return {
    observable: () => dbReplaySubject,
    close: () => dbReplaySubscription.unsubscribe(),
  };
};
