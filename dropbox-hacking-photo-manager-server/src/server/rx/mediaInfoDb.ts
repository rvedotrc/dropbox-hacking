import { ReplaySubject } from "rxjs";
import { jsonFileObservableViaLoader } from "./util.js";
import {
  ContentHash,
  MediainfoDB,
  MediainfoFromHash,
} from "@blaahaj/dropbox-hacking-mediainfo-db";

export const buildForMediaInfoDbMap = (dbDir: string) => {
  const observable = jsonFileObservableViaLoader(
    dbDir,
    () => new MediainfoDB(dbDir).readAll(),
    100,
  );

  const subject = new ReplaySubject<Map<ContentHash, MediainfoFromHash>>(1);
  const subscription = observable.subscribe(subject);

  return {
    observable: () => subject,
    close: () => subscription.unsubscribe(),
  };
};
