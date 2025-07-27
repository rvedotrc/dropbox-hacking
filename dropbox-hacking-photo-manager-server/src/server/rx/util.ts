import { watch } from "fs";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { debounceTime, distinctUntilChanged, Observable, tap } from "rxjs";
import { isDeepStrictEqual } from "util";

export const addSequence = <T>(): ((value: T) => {
  value: T;
  sequence: number;
}) => {
  let nextSeq = 0;
  return (value) => ({ value, sequence: nextSeq++ });
};

export const pathChangedObservable = (path: string) =>
  new Observable<void>((subscriber) => {
    const w = watch(path, { recursive: false, persistent: true });
    w.addListener("change", () => subscriber.next());
    w.addListener("error", (error) => subscriber.error(error));
    return () => w.close();
  });

export const jsonFileObservableViaLoader = <T>(
  dir: string,
  loader: () => Promise<T>,
  dTime: number,
) =>
  pathChangedObservable(dir)
    .pipe(tap(() => console.log(`path changed ${dir}`)))
    .pipe(debounceTime(dTime))
    .pipe(tap(() => console.log(`path changed ${dir} (debounced)`)))
    .pipe(
      (incoming) =>
        new Observable<T>((outgoing) => {
          const doRead = () =>
            // FIXME: what if the reads overlap?
            loader().then(
              (value) => outgoing.next(value),
              (error) => outgoing.error(error),
            );

          const x = incoming.subscribe({
            next: () => void doRead(),
            error: (error) => outgoing.error(error),
          });

          void doRead();

          return () => x.unsubscribe();
        }),
    )
    .pipe(distinctUntilChanged<T>(isDeepStrictEqual));

export const jsonFileObservable = <T>(path: string, dTime: number) =>
  jsonFileObservableViaLoader(
    dirname(path),
    async (): Promise<T> =>
      JSON.parse(await readFile(path, { encoding: "utf-8" })) as T,
    dTime,
  );
