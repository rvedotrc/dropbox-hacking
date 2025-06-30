import { map, ReplaySubject } from "rxjs";
import DayDb from "../dayDb.js";
import type { DayMetadata } from "dropbox-hacking-photo-manager-shared";
import { jsonFileObservableViaLoader } from "./util.js";

export const buildForDayDb = (dbDir: string) => {
  const dayDbObservable = jsonFileObservableViaLoader<DayMetadata[]>(
    dbDir,
    () => new DayDb(dbDir).days(),
    100,
  ).pipe(
    map((array) => {
      const out: Record<string, DayMetadata> = {};
      for (const item of array) {
        out[item.date] = item;
      }
      return out;
    }),
  );

  const dayDbSubject = new ReplaySubject<Record<string, DayMetadata>>(1);
  const subscription = dayDbObservable.subscribe(dayDbSubject);

  return {
    observable: () => dayDbSubject,
    close: () => subscription.unsubscribe(),
  };
};

export const buildForDayDbMap = (dbDir: string) => {
  const dayDbObservable = jsonFileObservableViaLoader<DayMetadata[]>(
    dbDir,
    () => new DayDb(dbDir).days(),
    100,
  ).pipe(
    map((array) => {
      const out = new Map<string, DayMetadata>();
      for (const item of array) {
        out.set(item.date, item);
      }
      return out;
    }),
  );

  const dayDbSubject = new ReplaySubject<Map<string, DayMetadata>>(1);
  const subscription = dayDbObservable.subscribe(dayDbSubject);

  return {
    observable: () => dayDbSubject,
    close: () => subscription.unsubscribe(),
  };
};
