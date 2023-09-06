import { Dropbox } from "dropbox";

import { GlobalOptions } from "../global-options";
import { cancel } from "./retrying-promise";
import WrappedMethod from "./wrapped-method";

const timeoutFor: Partial<Record<keyof Dropbox, number>> = {
  filesGetTemporaryLink: 30000,
};

const defaultTimeout = 300000;

export const retrier = (
  dbx: Dropbox,
  globalOptions: GlobalOptions,
): Dropbox => {
  for (const m in dbx) {
    // Unsafe coercion; there might be an internal method wrapped as part
    // of this, which isn't part of the public interface (i.e. keyof Dropbox).
    const methodName = m as keyof Dropbox;

    if (typeof dbx[methodName] !== "function") continue;

    const timeout = timeoutFor[methodName] || defaultTimeout;
    new WrappedMethod(dbx, methodName, globalOptions, timeout).wrap();
  }

  return dbx;
};

export { cancel };
