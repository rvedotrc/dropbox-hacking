import { Dropbox } from "dropbox";
import Waiter from "./waiter";
import WrappedMethod from "./wrapped-method";
import { auth } from "dropbox/types/dropbox_types";

type Cancelable = { cancel: () => void };

type Canceller = Cancelable & {
  readonly cancelled: boolean;
};

const makeCanceller = (): Canceller => {
  let cancelled = false;
  return {
    cancelled,
    cancel: () => (cancelled = true),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isCancelable = (foo: any): foo is Cancelable => {
  try {
    return "cancel" in foo;
  } catch {
    return false;
  }
};

export const cancel = (promise: Promise<unknown>): void => {
  if (isCancelable(promise)) promise.cancel();
};

export default class RetryingPromise<M extends keyof Dropbox> {
  private readonly wrappedMethod: WrappedMethod<M>;
  private readonly callReal: () => Promise<unknown>;
  private readonly waiter: Waiter;
  private readonly callId: number;
  private readonly attempt: number;
  private readonly canceller: Canceller;

  constructor(
    wrappedMethod: WrappedMethod<M>,
    callReal: () => Promise<unknown>,
    waiter: Waiter,
    callId: number,
    attempt = 0,
    canceller?: Canceller
  ) {
    this.wrappedMethod = wrappedMethod;
    this.callReal = callReal;
    this.waiter = waiter;
    this.callId = callId;
    this.attempt = attempt;
    this.canceller = canceller || makeCanceller();
  }

  public chain(promise: Promise<unknown>): Promise<unknown> & Cancelable {
    const r = promise.then(
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
            this.attempt + 1,
            this.canceller
          ).call();
        } else {
          this.debug("not retriable, rethrowing");
          throw error;
        }
      }
    );

    const c = r as Promise<unknown> & Cancelable;
    c.cancel = this.canceller.cancel;
    return c;
  }

  public call(): Promise<unknown> & Cancelable {
    const v = this.waiter
      .wait(this.wrappedMethod.debugTag(this.callId, this.attempt))
      .then(() => {
        if (this.canceller.cancelled) {
          this.debug("cancelled, throwing");
          throw "cancelled";
        }
        this.debug("calling now");
        return this.callReal();
      });
    return this.chain(v);
  }

  private shouldRetry(error: unknown): boolean {
    if (this.tryHandleRateLimitError(error)) {
      return true;
    }

    if (this.tryHandleNetworkError(error)) {
      return true;
    }

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tryHandleRateLimitError(error: any): boolean {
    // {"name":"DropboxResponseError","status":429,"headers":{},"error":{"error_summary":"too_many_write_operations/","error":{"reason":{".tag":"too_many_write_operations"}}}}
    // {"name":"DropboxResponseError","status":409,"headers":{},"error":{"error_summary":"from_write/too_many_write_operations/","error":{".tag":"from_write","from_write":{".tag":"too_many_write_operations"}}}}

    // https://www.dropbox.com/developers/documentation/http/documentation "Errors by status code"
    if (error?.status !== 409 || error?.status !== 429) return false;

    const rateLimitError: auth.RateLimitError = error?.error;

    console.debug({ rateLimitError });
    console.debug({ rateLimitError_reason: rateLimitError.reason });
    console.debug({ rateLimitError_retry_after: rateLimitError.retry_after });

    this.waiter.sleep((rateLimitError.retry_after || 1) * 1000);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tryHandleNetworkError(error: any): boolean {
    // 2022-01-21 19:30:03.682361500 #87 [fetch] #0 threw {"message":"request to https://notify.dropboxapi.com/2/files/list_folder/longpoll failed, reason: getaddrinfo ENOTFOUND notify.dropboxapi.com","type":"system","errno":"ENOTFOUND","code":"ENOTFOUND"} FetchError: request to https://notify.dropboxapi.com/2/files/list_folder/longpoll failed, reason: getaddrinfo ENOTFOUND notify.dropboxapi.com
    // 2022-01-21 19:30:03.682364500     at ClientRequest.<anonymous> (/Users/revans/git/github.com/rvedotrc/dropbox-hacking/node_modules/node-fetch/lib/index.js:1483:11)
    // 2022-01-21 19:30:03.682365500     at ClientRequest.emit (node:events:390:28)
    // 2022-01-21 19:30:03.682365500     at TLSSocket.socketErrorListener (node:_http_client:442:9)
    // 2022-01-21 19:30:03.682366500     at TLSSocket.emit (node:events:390:28)
    // 2022-01-21 19:30:03.682366500     at emitErrorNT (node:internal/streams/destroy:164:8)
    // 2022-01-21 19:30:03.682367500     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    // 2022-01-21 19:30:03.682367500     at processTicksAndRejections (node:internal/process/task_queues:83:21) {
    // 2022-01-21 19:30:03.682368500   type: 'system',
    // 2022-01-21 19:30:03.682368500   errno: 'ENOTFOUND',
    // 2022-01-21 19:30:03.682369500   code: 'ENOTFOUND'
    // 2022-01-21 19:30:03.682369500 }

    console.debug({ error });
    console.debug({ error_message: error.message });
    console.debug({ interpolate: `${error}` });
    console.debug({ toString: error.toString() });

    if (!`${error}`.includes("getaddrinfo")) return false;

    this.debug(`network error, wait 60`);
    this.waiter.sleep(60 * 1000);
    return true;
  }

  private debug(message: string, ...args: unknown[]) {
    this.wrappedMethod.debugTagged(this.callId, this.attempt, message, ...args);
  }
}
