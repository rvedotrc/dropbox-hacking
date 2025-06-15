import { map, ReplaySubject } from "rxjs";
import { jsonFileObservable } from "./util.js";
import type { PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import writeFileAtomic from "write-file-atomic";

export type PhotoDb = Record<string, PhotoDbEntry>;

export const buildForPhotoDb = (path: string) => {
  const dbObservable = jsonFileObservable<PhotoDb>(`${path}/photos.json`, 100);

  const dbReplaySubject = new ReplaySubject<Record<string, PhotoDbEntry>>(1);
  const dbReplaySubscription = dbObservable.subscribe(dbReplaySubject);

  return {
    observable: () => dbReplaySubject,
    close: () => dbReplaySubscription.unsubscribe(),
    update: async (rev: string, entry: PhotoDbEntry) => {
      const all = JSON.parse(
        await readFile(`${path}/photos.json`, { encoding: "utf-8" }),
      ) as PhotoDb;

      if (isDeepStrictEqual(all[rev], entry)) return;

      all[rev] = entry;

      await writeFileAtomic(`${path}/photos.json`, JSON.stringify(all) + "\n", {
        encoding: "utf-8",
      });
    },
  };
};

export const buildForPhotoDbMap = (path: string) => {
  const dbObservable = jsonFileObservable<PhotoDb>(
    `${path}/photos.json`,
    100,
  ).pipe(
    map((record) => new Map<string, PhotoDbEntry>(Object.entries(record))),
  );

  const dbReplaySubject = new ReplaySubject<Map<string, PhotoDbEntry>>(1);
  const dbReplaySubscription = dbObservable.subscribe(dbReplaySubject);

  return {
    observable: () => dbReplaySubject,
    close: () => dbReplaySubscription.unsubscribe(),
  };
};
