export type CancelablePromise<T> = {
  cancel: () => void;
  canceled(): boolean;
} & Promise<T>;

export const cancelablePromise = <T>(
  builder: (
    resolve: (value: T) => void,
    reject: (reason: unknown) => void,
    onCancel: (cancelCallback: () => void) => void,
    canceled: () => boolean,
  ) => void,
): CancelablePromise<T> => {
  let onCancel: (() => void) | undefined = undefined;
  const setOnCancel = (cb: typeof onCancel): void => {
    onCancel = cb;
  };

  let canceled = false;
  const readCanceled = () => canceled;

  const promise = new Promise((resolve, reject) =>
    builder(resolve, reject, setOnCancel, readCanceled),
  ) as CancelablePromise<T>;

  promise.cancel = () => {
    if (canceled) return;

    canceled = true;
    onCancel?.();
  };
  promise.canceled = readCanceled;

  return promise;
};
