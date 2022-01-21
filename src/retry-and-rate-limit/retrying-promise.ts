import { Dropbox } from "dropbox";
import Waiter from "./waiter";
import WrappedMethod from "./wrapped-method";

export default class RetryingPromise<M extends keyof Dropbox> {
  private readonly wrappedMethod: WrappedMethod<M>;
  private readonly callReal: () => Promise<unknown>;
  private readonly waiter: Waiter;
  private readonly callId: number;
  private readonly attempt: number;

  constructor(
    wrappedMethod: WrappedMethod<M>,
    callReal: () => Promise<unknown>,
    waiter: Waiter,
    callId: number,
    attempt = 0
  ) {
    this.wrappedMethod = wrappedMethod;
    this.callReal = callReal;
    this.waiter = waiter;
    this.callId = callId;
    this.attempt = attempt;
  }

  public chain(promise: Promise<unknown>): Promise<unknown> {
    // TODO: could add cancelable behaviour

    return promise.then(
      (value) => {
        this.debug("returned");
        return value;
      },
      (error) => {
        this.debug("threw", JSON.stringify(error), error);
        if (this.shouldRetry(error)) {
          this.debug("retriable");
          return new RetryingPromise(
            this.wrappedMethod,
            this.callReal,
            this.waiter,
            this.callId,
            this.attempt + 1
          ).call();
        } else {
          this.debug("not retriable, rethrowing");
          throw error;
        }
      }
    );
  }

  public call(): Promise<unknown> {
    const v = this.waiter
      .wait(this.wrappedMethod.debugTag(this.callId, this.attempt))
      .then(() => {
        this.debug("calling now");
        return this.callReal();
      });
    return this.chain(v);
  }

  private shouldRetry(error: unknown): boolean {
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
      return true;
    }

    if (this.isRateLimitError(error)) {
      this.handleRateLimitError(error);
      return true;
    }

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isRateLimitError(error: any): boolean {
    // {"name":"DropboxResponseError","status":429,"headers":{},"error":{"error_summary":"too_many_write_operations/","error":{"reason":{".tag":"too_many_write_operations"}}}}
    // {"name":"DropboxResponseError","status":409,"headers":{},"error":{"error_summary":"from_write/too_many_write_operations/","error":{".tag":"from_write","from_write":{".tag":"too_many_write_operations"}}}}

    // console.debug(JSON.stringify(input));

    if (error?.error?.error_summary?.includes("too_many_write_operations"))
      return true;

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleRateLimitError(error: any): void {
    let retryAfter: number | undefined = undefined;
    if (error.error && error.error.retry_after)
      retryAfter = error.error.retry_after;
    this.debug("retryAfter", retryAfter);

    const sleepSeconds = retryAfter || 1;
    this.waiter.sleep(sleepSeconds * 1000);
  }

  // err: FetchError: request to https://notify.dropboxapi.com/2/files/list_folder/longpoll failed, reason: getaddrinfo ENOTFOUND notify.dropboxapi.com
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isNetworkError(error: any): boolean {
    const msg = error?.err;
    if (typeof msg !== "string") return false;

    return msg.includes("getaddrinfo");
  }

  private handleNetworkError(_error: unknown): void {
    this.debug(`network error, wait 60`);
    this.waiter.sleep(60);
  }

  private debug(message: string, ...args: unknown[]) {
    this.wrappedMethod.debugTagged(this.callId, this.attempt, message, ...args);
  }
}
