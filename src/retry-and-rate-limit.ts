import { Dropbox } from "dropbox";

const applyRateLimit = (
  dbx: Dropbox,
  methodName: keyof Dropbox,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any
): Promise<void> | undefined => {
  const { status, error } = err;
  console.debug({ status, error });
  if (status !== 429 || !error) return;

  if (
    !error.error ||
    !error.error.reason ||
    error.error.reason[".tag"] !== "too_many_write_operations"
  )
    return;

  let retryAfter: number | undefined = undefined;
  if (error.error && error.error.retry_after)
    retryAfter = error.error.retry_after;
  console.debug("retryAfter", retryAfter);

  const sleepSeconds = retryAfter || 1;

  return new Promise((resolve) =>
    setInterval(resolve, sleepSeconds * 1000)
  ).then(() => {
    const wrappedFunc = dbx[methodName];
    return wrappedFunc.call(dbx, ...args);
  });
};

let id = 0;

export default (dbx: Dropbox): Dropbox => {
  for (const m in dbx) {
    const methodName = m as keyof Dropbox;
    const realFunction = dbx[methodName];

    if (typeof realFunction === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrapper = (...args: any): any => {
        const requestId = ++id;
        // console.debug(`#${requestId} ${methodName} calling`);
        // const value = realFunction.call(t, ...args);
        const value = realFunction.call(dbx, ...args);
        // console.debug(`#${requestId} ${methodName} returned`);

        if ("then" in value && "catch" in value) {
          // console.debug(
          //   `#${requestId} ${methodName} returned promise, appending then-handler`
          // );
          return (value as Promise<unknown>).then(
            (result) => {
              // console.debug(`#${requestId} ${methodName} resolved`);
              return result;
            },
            (err) => {
              console.error(
                `#${requestId} ${methodName} rejected`,
                JSON.stringify(err, null, 2)
              );

              const retryingPromise = applyRateLimit(
                dbx,
                methodName,
                args,
                err
              );
              if (retryingPromise) return retryingPromise;

              throw err;
            }
          );
        } else {
          // console.debug(
          //   `#${requestId} ${methodName} returned non-promise, unwrapping and returning as-is`
          // );
          // Unwrap for next time
          dbx[methodName] = realFunction as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          return value;
        }
      };

      dbx[methodName] = wrapper as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  return dbx;
};

// TODO: if a promise is rejected with an error like
// {
//     error_summary: 'expired_access_token/.',
//     error: { '.tag': 'expired_access_token' }
//   }
// then ... do something.

// fetch rejected {
//   "message": "request to ...",
//   "type": "system",
//   "errno": "ETIMEDOUT",
//   "code": "ETIMEDOUT"
// }

// {
//   "message": "request to ...",
//   "type": "system",
//   "errno": "ENOTFOUND",
//   "code": "ENOTFOUND"
// }
