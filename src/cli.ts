import { GlobalOptions, Operation } from "./types";
import { getDropboxClient } from "./auth";

import catOperation from "./operations/cat";
import contentHashStdinOperation from "./operations/contentHashStdin";
import cpOperation from "./operations/cp";
import lsOperation from "./operations/ls";
import mkdirOperation from "./operations/mkdir";
import mvOperation from "./operations/mv";
import rmOperation from "./operations/rm";
import syncDownloadOperation from "./operations/syncDownload";
import syncUploadOperation from "./operations/syncUpload";
import uploadStdinOperation from "./operations/uploadStdin";
import retrier from "./retry-and-rate-limit";
import { processOptions } from "./options";
import { writeStderr } from "./util/logging";

const prefix = "./bin/cli";

const DEBUG_UPLOAD = "--debug-upload";
const DEBUG_SYNC = "--debug-sync";
const DEBUG_ERRORS = "--debug-errors";
const DEBUG_POLL = "--debug-poll";

export const getGlobalOptions = (
  argv: string[]
): { globalOptions: GlobalOptions; remainingArgs: string[] } => {
  const globalOptions: GlobalOptions = {
    debugUpload: false,
    debugSync: false,
    debugErrors: false,
    debugPoll: false,
  };

  const remainingArgs = processOptions(argv, {
    [DEBUG_UPLOAD]: () => (globalOptions.debugUpload = true),
    [DEBUG_SYNC]: () => (globalOptions.debugSync = true),
    [DEBUG_ERRORS]: () => (globalOptions.debugErrors = true),
    [DEBUG_POLL]: () => (globalOptions.debugPoll = true),
  });

  return { globalOptions, remainingArgs };
};

export default (argv: string[]): void => {
  // download_zip (could be useful)
  // get_metadata (is this different from "ls"?)
  const operations: Operation[] = [
    catOperation,
    contentHashStdinOperation,
    cpOperation,
    lsOperation,
    mkdirOperation,
    mvOperation,
    rmOperation,
    syncDownloadOperation,
    syncUploadOperation,
    uploadStdinOperation,
  ];

  const usageFail = async (verb?: string): Promise<void> => {
    let s = "Usage:\n";

    for (const op of operations) {
      if (verb === undefined || verb === op.verb) {
        const argsHelp =
          typeof op.argsHelp === "string" ? [op.argsHelp] : op.argsHelp;
        for (const help of argsHelp) {
          s += `  ${prefix} [GLOBAL-OPTIONS] ${op.verb} ${help}\n`;
        }
      }
    }

    s +=
      "Global options are:\n" +
      `  ${DEBUG_UPLOAD} - enable debugging of large file uploads\n` +
      `  ${DEBUG_SYNC} - enable debugging of sync operations\n` +
      `  ${DEBUG_ERRORS} - enable debugging of rate limiting and retrying\n` +
      `  ${DEBUG_POLL} - enable debugging of long-polling\n`;

    writeStderr(s).then(() => process.exit(2));
  };

  const { globalOptions, remainingArgs } = getGlobalOptions(argv);

  const getter = () =>
    getDropboxClient().then((dbx) => retrier(dbx, globalOptions));

  const op = operations.find(({ verb }) => verb === remainingArgs[0]);
  if (op) {
    op.handler(
      getter,
      remainingArgs.splice(1),
      globalOptions,
      async () => await usageFail(op.verb)
    ).catch((err) => {
      console.error({ err, stack: err.stack });
      process.exit(1);
    });
  } else usageFail();
};
