type Entry<T> = {
  makePromise: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  tag: unknown;
};

type Limiter<T> = {
  submit: (makePromise: () => Promise<T>, tag?: unknown) => Promise<T>;
};

export default <T>(size: number): Limiter<T> => {
  let free = size;
  const queue: Entry<T>[] = [];

  const tryStart = () => {
    while (free > 0 && queue.length > 0) {
      --free;
      const { makePromise, resolve, reject, tag } = queue.shift();
      console.debug(`limiter start job ${tag}`);
      makePromise()
        .finally(() => {
          console.debug(`limiter end job ${tag}`);
          ++free;
          tryStart();
        })
        .then(resolve, reject);
    }
  };

  const submit = (makePromise: () => Promise<T>, tag?: unknown): Promise<T> => {
    console.debug(`limiter submit job ${tag}`);
    return new Promise((resolve, reject) => {
      queue.push({ makePromise, resolve, reject, tag });
      tryStart();
    });
  };

  return {
    submit,
  };
};
