export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
  canceled(): boolean;
}

export const cancelablePromise = <T>(
  fn: (
    resolve: (value: T) => void,
    reject: (reason: unknown) => void,
    onCancel: (fn: () => void) => void,
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
    fn(resolve, reject, setOnCancel, readCanceled),
  ) as CancelablePromise<T>;

  promise.cancel = () => {
    if (canceled) return;

    canceled = true;
    onCancel?.();
  };
  promise.canceled = readCanceled;

  return promise;
};
