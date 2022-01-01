import { Dropbox } from "dropbox";
import { GlobalOptions } from "./types";

let id = 0;

class RateLimitWaiter {
  private readonly globalOptions: GlobalOptions;

  private state:
    | undefined
    | {
        queue: (() => void)[];
        until: number;
        timer: NodeJS.Timeout;
      } = undefined;

  constructor(globalOptions: GlobalOptions) {
    this.globalOptions = globalOptions;
  }

  public sleep(millis: number): void {
    this.debug(`RateLimitWaiter - sleep ${millis}`);
    const newUntil = new Date().getTime() + millis;
    if (this.state && this.state.until > newUntil) return;

    if (this.state && this.state.timer) clearTimeout(this.state.timer);

    this.state = {
      queue: this.state?.queue || [],
      until: newUntil,
      timer: setTimeout(() => this.wakeUp(), millis),
    };
  }

  public wait(message: string): Promise<void> {
    const t = this; // eslint-disable-line @typescript-eslint/no-this-alias

    return new Promise((resolve) => {
      if (!t.state) {
        this.debug(`${message} RateLimitWaiter - no wait`);
        return resolve();
      }

      this.debug(`${message} RateLimitWaiter - enqueueing`);
      t.state.queue.push(() => {
        this.debug(`${message} RateLimitWaiter - woke up`);
        resolve();
      });
    });
  }

  private wakeUp() {
    this.state?.queue.forEach((f) => process.nextTick(f));
    this.state = undefined;
  }

  private debug(...args: unknown[]) {
    if (this.globalOptions.debugErrors) console.debug(...args);
  }
}

export default (dbx: Dropbox, globalOptions: GlobalOptions): Dropbox => {
  const rateLimitWaiter = new RateLimitWaiter(globalOptions);

  const debug = (...args: unknown[]) => {
    if (globalOptions.debugErrors) console.debug(...args);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const retryError = (error: any): boolean => {
    if (
      !error.error ||
      !error.error.reason ||
      error.error.reason[".tag"] !== "too_many_write_operations"
    )
      return false;

    let retryAfter: number | undefined = undefined;
    if (error.error && error.error.retry_after)
      retryAfter = error.error.retry_after;
    debug("retryAfter", retryAfter);

    const sleepSeconds = retryAfter || 1;
    rateLimitWaiter.sleep(sleepSeconds * 1000);
    return true;
  };

  const handlePromise = (
    methodName: string,
    real: (...args: unknown[]) => Promise<unknown>,
    callId: number,
    args: unknown[],
    promise: Promise<unknown>,
    sequence: number
  ): Promise<unknown> =>
    promise.then(
      (value) => {
        debug(`#${callId} [${methodName}] #${sequence} success`);
        // log success
        return value;
      },
      (err) => {
        debug(`#${callId} [${methodName}] #${sequence} error`);

        if (!retryError(err)) {
          debug(
            `#${callId} [${methodName}] #${sequence} rethrow ${JSON.stringify(
              err
            )}`
          );
          throw err;
        }

        debug(`#${callId} [${methodName}] #${sequence} call again`);
        const nextPromise = rateLimitWaiter
          .wait(`#${callId} [${methodName}] #${sequence}`)
          .then(() => real.call(dbx, ...args) as Promise<unknown>);

        return handlePromise(
          methodName,
          real,
          callId,
          args,
          nextPromise,
          sequence + 1
        );
      }
    );

  const wrapUnknown = <M extends keyof Dropbox>(
    methodName: M
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): unknown => {
    const real = dbx[methodName];
    if (typeof real !== "function") return real;

    let returnsPromises = false;

    return (...args: Parameters<Dropbox[M]>): ReturnType<Dropbox[M]> => {
      const callId = ++id;
      debug(`#${callId} [${methodName}] immediate call`);
      const value = returnsPromises
        ? rateLimitWaiter
            .wait(`#${callId} [${methodName}] 0`)
            .then(() => real.call(dbx, ...args))
        : real.call(dbx, ...args);

      if (!("then" in value) || !("finally" in value)) {
        // Not a promise; unwrap
        debug(`#${callId} [${methodName}] not a promise function - unwrapping`);
        dbx[methodName] = real;
        return value;
      }

      // Returned a promise; re-wrap to make it easier next time
      // wrapPromise(dbx, methodName, real, rateLimitWaiter);
      returnsPromises = true;

      // Handle the value we just got
      return handlePromise(
        methodName,
        real,
        callId,
        args,
        value,
        0
      ) as ReturnType<Dropbox[M]>;
    };
  };

  for (const m in dbx) {
    const methodName = m as keyof Dropbox;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbx[methodName] = wrapUnknown(methodName) as any;
  }

  return dbx;
};
