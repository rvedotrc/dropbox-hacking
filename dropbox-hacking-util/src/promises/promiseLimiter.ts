import { GlobalOptionsSingleton } from "../global-options/index.js";

type Tag = string | (() => string);

type Entry<T> = {
  id: number;
  makePromise: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  tag: Tag;
};

export type PromiseLimiter<T> = {
  submit: (makePromise: () => Promise<T>, tag: Tag) => Promise<T>;
};

const tagToString = (tag: Tag) => (typeof tag === "string" ? tag : tag());

export const makePromiseLimiter = <T>(
  size: number,
  name: string,
): PromiseLimiter<T> => {
  let free = size;
  const queue: Entry<T>[] = [];

  const inFlight = new Set<Entry<T>>();
  const describe = () =>
    [...inFlight]
      .map((e) => e.id)
      .sort()
      .join(",");

  const tryStart = () => {
    while (free > 0) {
      const entry = queue.shift();
      if (!entry) break;

      --free;
      const { id, makePromise, resolve, reject, tag } = entry;
      inFlight.add(entry);
      if (GlobalOptionsSingleton.get()?.debugLimiter)
        console.debug(
          `${name} start job #${id}/${nextId} ${tagToString(
            tag,
          )} (in flight: ${describe()})`,
        );
      makePromise()
        .finally(() => {
          inFlight.delete(entry);
          if (GlobalOptionsSingleton.get()?.debugLimiter)
            console.debug(
              `${name} end job #${id}/${nextId} ${tagToString(
                tag,
              )} (in flight: ${describe()})`,
            );
          ++free;
          tryStart();
        })
        .then(resolve, reject);
    }
  };

  let nextId = 0;

  const submit = (makePromise: () => Promise<T>, tag: Tag): Promise<T> => {
    const id = nextId++;
    if (GlobalOptionsSingleton.get()?.debugLimiter)
      console.debug(`${name} submit job #${id} ${tagToString(tag)}`);
    return new Promise((resolve, reject) => {
      queue.push({ id, makePromise, resolve, reject, tag });
      tryStart();
    });
  };

  return {
    submit,
  };
};
