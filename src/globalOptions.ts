import { GlobalOptions } from "./types";
import { processOptions } from "./options";

const DEBUG_UPLOAD = "--debug-upload";
const DEBUG_SYNC = "--debug-sync";
const DEBUG_ERRORS = "--debug-errors";
const DEBUG_POLL = "--debug-poll";
const DEBUG_LIMITER = "--debug-limiter";

export const HELP = [
  `${DEBUG_LIMITER} - enable debugging of concurrency limiting`,
  `${DEBUG_UPLOAD} - enable debugging of large file uploads`,
  `${DEBUG_SYNC} - enable debugging of sync operations`,
  `${DEBUG_ERRORS} - enable debugging of rate limiting and retrying`,
  `${DEBUG_POLL} - enable debugging of long-polling`,
];

export const GlobalOptionsSingleton = (() => {
  let shared: GlobalOptions | undefined;

  return {
    set: (globalOptions: GlobalOptions): GlobalOptions =>
      (shared = globalOptions),
    get: (): GlobalOptions | undefined => shared,
  };
})();

export const getGlobalOptions = (
  argv: string[]
): { globalOptions: GlobalOptions; remainingArgs: string[] } => {
  const globalOptions: GlobalOptions = {
    debugUpload: false,
    debugSync: false,
    debugErrors: false,
    debugPoll: false,
    debugLimiter: false,
  };

  const remainingArgs = processOptions(argv, {
    [DEBUG_UPLOAD]: () => (globalOptions.debugUpload = true),
    [DEBUG_SYNC]: () => (globalOptions.debugSync = true),
    [DEBUG_ERRORS]: () => (globalOptions.debugErrors = true),
    [DEBUG_POLL]: () => (globalOptions.debugPoll = true),
    [DEBUG_LIMITER]: () => (globalOptions.debugLimiter = true),
  });

  return { globalOptions, remainingArgs };
};
