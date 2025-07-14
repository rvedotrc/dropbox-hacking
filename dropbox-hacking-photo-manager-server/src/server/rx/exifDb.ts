import {
  ContentHash,
  ExifDB,
  ExifFromHash,
} from "@blaahaj/dropbox-hacking-exif-db";
import { ReplaySubject } from "rxjs";

import { jsonFileObservableViaLoader } from "./util.js";

export const buildForExifDbMap = (dbDir: string) => {
  const observable = jsonFileObservableViaLoader(
    dbDir,
    () => new ExifDB(dbDir).readAll(),
    100,
  );

  const subject = new ReplaySubject<Map<ContentHash, ExifFromHash>>(1);
  const subscription = observable.subscribe(subject);

  return {
    observable: () => subject,
    close: () => subscription.unsubscribe(),
  };
};
