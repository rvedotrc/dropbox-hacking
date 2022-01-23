type Entry<T> = {
  id: number;
  makePromise: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  tag: unknown;
};

export type Limiter<T> = {
  submit: (makePromise: () => Promise<T>, tag?: unknown) => Promise<T>;
};

export default <T>(size: number): Limiter<T> => {
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
      console.debug(
        `limiter start job #${id} ${tag} (in flight: ${describe()})`
      );
      makePromise()
        .finally(() => {
          inFlight.delete(entry);
          console.debug(
            `limiter end job #${id} ${tag} (in flight: ${describe()})`
          );
          ++free;
          tryStart();
        })
        .then(resolve, reject);
    }
  };

  let nextId = 0;

  const submit = (makePromise: () => Promise<T>, tag?: unknown): Promise<T> => {
    const id = nextId++;
    console.debug(`limiter submit job #${id} ${tag}`);
    return new Promise((resolve, reject) => {
      queue.push({ id, makePromise, resolve, reject, tag });
      tryStart();
    });
  };

  return {
    submit,
  };
};
