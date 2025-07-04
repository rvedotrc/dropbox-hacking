import { filter, map, ReplaySubject } from "rxjs";
import { jsonFileObservableViaLoader } from "./util.js";
import { State, StateDir } from "@blaahaj/dropbox-hacking-ls-cache";
import { files } from "dropbox";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";

const imageFilenamePattern = /\.(jpg|jpeg|png)$/;

// export type ObservedType<T extends Observable<unknown>> =
//   T extends Observable<infer X> ? X : never;

export const buildForLsCache = (dbDir: string) => {
  const onlyImagesObservable = jsonFileObservableViaLoader<State>(
    dbDir,
    async () => {
      const db = new StateDir(dbDir);
      await db.load();
      return db.getState();
    },
    100,
  )
    .pipe(filter((s) => s.tag === "ready"))
    .pipe(
      map((s) =>
        [...s.entries.values()].filter((item) => item[".tag"] === "file"),
      ),
    )
    .pipe(map((t): files.FileMetadata[] => t))
    .pipe(
      map((arr) =>
        arr.filter(
          (item): item is typeof item & { path_lower: string } =>
            item.path_lower !== undefined,
        ),
      ),
    )
    .pipe(
      map((arr) =>
        arr.filter(
          (item): item is typeof item & { path_display: string } =>
            item.path_display !== undefined,
        ),
      ),
    )
    .pipe(
      map((arr) =>
        arr.filter(
          (item): item is typeof item & { content_hash: string } =>
            item.content_hash !== undefined,
        ),
      ),
    )
    .pipe(
      map((arr) =>
        arr.filter((item) => imageFilenamePattern.test(item.path_lower)),
      ),
    )
    .pipe(
      map((arr) => {
        const out: Record<string, (typeof arr)[number]> = {};
        for (const item of arr) out[item.id] = item;
        return out;
      }),
    );

  const onlyImagesSubject = new ReplaySubject<Record<string, NamedFile>>(1);

  const subscription = onlyImagesObservable.subscribe(onlyImagesSubject);

  return {
    observable: () => onlyImagesSubject,
    close: () => subscription.unsubscribe(),
  };
};

export const buildForLsCacheMapAllFiles = (dbDir: string) => {
  const observable = jsonFileObservableViaLoader<State>(
    dbDir,
    async () => {
      const db = new StateDir(dbDir);
      await db.load();
      return db.getState();
    },
    100,
  )
    .pipe(filter((s) => s.tag === "ready"))
    .pipe(
      map((s) =>
        [...s.entries.values()].filter((item) => item[".tag"] === "file"),
      ),
    )
    .pipe(map((t): files.FileMetadata[] => t))
    .pipe(
      map((arr) =>
        arr.filter(
          (
            item,
          ): item is typeof item & {
            path_lower: string;
            path_display: string;
            content_hash: string;
          } =>
            item.path_lower !== undefined &&
            item.path_display !== undefined &&
            item.content_hash !== undefined,
        ),
      ),
    )
    .pipe(
      map((arr) => {
        const out = new Map<string, NamedFile>();
        for (const item of arr) out.set(item.rev, item);
        return out;
      }),
    );

  const replaySubject = new ReplaySubject<Map<string, NamedFile>>(1);

  const subscription = observable.subscribe(replaySubject);

  return {
    observable: () => replaySubject,
    close: () => subscription.unsubscribe(),
  };
};
