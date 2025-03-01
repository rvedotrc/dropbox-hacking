import { ReplaySubject } from "rxjs";
import { jsonFileObservableViaLoader } from "./util.js";
import { ContentHash, ExifDB, ExifFromHash } from "dropbox-hacking-exif-db";

export const buildForExifDb = (dbDir: string) => {
  const observable = jsonFileObservableViaLoader(
    dbDir,
    () =>
      new ExifDB(dbDir).readAll().then((map) => {
        const out: Record<ContentHash, ExifFromHash> = {};
        for (const [k, v] of map.entries()) out[k] = v;
        return out;
      }),
    100,
  );

  const subject = new ReplaySubject<Record<ContentHash, ExifFromHash>>(1);
  const subscription = observable.subscribe(subject);

  return {
    observable: () => subject,
    close: () => subscription.unsubscribe(),
  };
};
