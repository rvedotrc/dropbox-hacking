import { Dropbox } from "dropbox";
import { GlobalOptions } from "../types";
import Waiter from "./waiter";
import RetryingPromise from "./retrying-promise";

let nextCallId = 0;

const isPromise = (value: unknown): value is Promise<unknown> => {
  if (value === null) return false;
  if (typeof value !== "object") return false;
  if (!("then" in value)) return false;
  if (!("catch" in value)) return false;
  return true;
};

export default class WrappedMethod<M extends keyof Dropbox> {
  private readonly dbx: Dropbox;
  private readonly methodName: M;
  private readonly globalOptions: GlobalOptions;
  private readonly waiter: Waiter;
  private readonly real: Dropbox[M];
  private returnsPromises: true | undefined = undefined;

  constructor(dbx: Dropbox, methodName: M, globalOptions: GlobalOptions) {
    this.dbx = dbx;
    this.methodName = methodName;
    this.globalOptions = globalOptions;
    this.waiter = new Waiter(globalOptions);
    this.real = this.dbx[this.methodName];
  }

  public debugTag(callId: number, attempt: number): string {
    return `#${callId} [${this.methodName}] #${attempt}`;
  }

  public debugTagged(
    callId: number,
    attempt: number,
    message: string,
    ...args: unknown[]
  ): void {
    if (!this.globalOptions.debugErrors) return;

    console.debug(`${this.debugTag(callId, attempt)} ${message}`, ...args);
  }

  public wrap(): void {
    const wrapped = (...args: unknown[]) => {
      const callId = nextCallId++;
      const callReal = () => this.real.call(this.dbx, ...args);
      this.debugTagged(callId, 0, "wrapped function called with", args);

      if (this.returnsPromises === undefined) {
        // We don't yet know if this function returns promises. So in case it doesn't,
        // we have to call it right now, instead of after the waiter is ready.
        this.debugTagged(callId, 0, "call (not sure if returns promises)");
        const value = callReal();

        if (isPromise(value)) {
          this.debugTagged(callId, 0, "returned a promise");
          this.returnsPromises = true;
          return new RetryingPromise(this, callReal, this.waiter, callId).chain(
            value
          );
        } else {
          this.debugTagged(callId, 0, "did not return a promise; unwrapping");
          // No point wrapping this; restore the real function
          this.dbx[this.methodName] = this.real;
          return value;
        }
      } else {
        return new RetryingPromise(this, callReal, this.waiter, callId).call();
      }
    };

    // wrapped.__proto__ = this.real;
    console.debug("wrap", this.methodName, this.real, wrapped);

    this.dbx[this.methodName] = wrapped as Dropbox[M];
  }
}
