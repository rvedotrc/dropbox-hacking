import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";

import type { PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import { map, ReplaySubject } from "rxjs";
import writeFileAtomic from "write-file-atomic";

import { jsonFileObservable } from "./util.js";

export type PhotoDb = Record<string, PhotoDbEntry>;

export const buildForPhotoDb = (path: string) => {
  const dbObservable = jsonFileObservable<PhotoDb>(`${path}/photos.json`, 100);

  const dbReplaySubject = new ReplaySubject<Record<string, PhotoDbEntry>>(1);
  const dbReplaySubscription = dbObservable.subscribe(dbReplaySubject);

  return {
    observable: () => dbReplaySubject,
    close: () => dbReplaySubscription.unsubscribe(),
    update: async (args: { contentHash: string; entry: PhotoDbEntry }) => {
      const all = JSON.parse(
        await readFile(`${path}/photos.json`, { encoding: "utf-8" }),
      ) as PhotoDb;

      if (isDeepStrictEqual(all[args.contentHash], args.entry)) return;

      all[args.contentHash] = args.entry;

      await writeFileAtomic(`${path}/photos.json`, JSON.stringify(all) + "\n", {
        encoding: "utf-8",
      });
    },
    transform: async (mutate: (current: PhotoDb) => Promise<PhotoDb>) => {
      const oldDb = JSON.parse(
        await readFile(`${path}/photos.json`, { encoding: "utf-8" }),
      ) as PhotoDb;

      const newDb = await mutate(oldDb);

      if (isDeepStrictEqual(oldDb, newDb)) return;

      await writeFileAtomic(
        `${path}/photos.json`,
        JSON.stringify(newDb) + "\n",
        {
          encoding: "utf-8",
        },
      );
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
