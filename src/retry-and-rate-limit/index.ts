import { Dropbox } from "dropbox";
import { GlobalOptions } from "../types";
import WrappedMethod from "./wrapped-method";

export default (dbx: Dropbox, globalOptions: GlobalOptions): Dropbox => {
  for (const m in dbx) {
    // Unsafe coercion; there might be an internal method wrapped as part
    // of this, which isn't part of the public interface (i.e. keyof Dropbox).
    const methodName = m as keyof Dropbox;

    if (typeof dbx[methodName] !== "function") continue;

    new WrappedMethod(dbx, methodName, globalOptions).wrap();
  }

  return dbx;
};

// export const cancel = (promise: Promise<unknown>): void => {
//     if
// };
