import { Dropbox } from "dropbox";

// const isDropboxResponse = (value: unknown): value is DropboxResponse<unknown> =>
//   value !== null &&
//   value !== undefined &&
//   typeof value === "object" &&
//   "status" in value &&
//   "headers" in value &&
//   "result" in value;

let id = 0;

export default (dbx: Dropbox): Dropbox => {
  for (const m in dbx) {
    const methodName = m as keyof Dropbox;
    const realFunction = dbx[methodName];

    if (typeof realFunction === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrapper = (...args: any): any => {
        const t = this; //eslint-disable-line @typescript-eslint/no-this-alias
        const requestId = ++id;
        console.debug(
          `#${requestId} ${methodName} calling with this=${JSON.stringify(
            t,
            null,
            2
          )} args=${JSON.stringify(args, null, 2)}`
        );
        // const value = realFunction.call(t, ...args);
        const value = realFunction.call(dbx, ...args);
        console.debug(`#${requestId} ${methodName} returned ${value}`);

        if ("then" in value && "catch" in value) {
          console.debug(
            `#${requestId} ${methodName} returned promise, appending then-handler`
          );
          return (value as Promise<unknown>).catch((err) => {
            // if (!isDropboxResponse(result)) {
            //   console.debug(
            //     `#${requestId} ${methodName} returned promise of non-response, returning promise-result as-is`
            //   );
            //   return result;
            // }
            //
            // console.debug(
            //   `#${requestId} ${methodName} returned promise of response, returning promise-result as-is (for now)`
            // );
            // return result;

            // if (err.error_summary === "expired_access_token/.") {
            //
            // }

            throw err;
          });
        } else {
          console.debug(
            `#${requestId} ${methodName} returned non-promise, unwrapping and returning as-is`
          );
          // Unwrap for next time
          dbx[methodName] = realFunction as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          return value;
        }
      };

      console.log("wrapped ", methodName);
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
