import {
  getDropboxClient,
  getGlobalOptions,
  GlobalOptionsSingleton,
  HELP,
  retrier,
  writeStderr,
} from "@blaahaj/dropbox-hacking-util";

import catOperation from "./operations/cat.js";
import contentHashStdinOperation from "./operations/contentHashStdin.js";
import cpOperation from "./operations/cp.js";
import lsOperation from "./operations/ls.js";
import mkdirOperation from "./operations/mkdir.js";
import mvOperation from "./operations/mv.js";
import rmOperation from "./operations/rm.js";
import syncDownloadOperation from "./operations/syncDownload.js";
import syncUploadOperation from "./operations/syncUpload.js";
import uploadStdinOperation from "./operations/uploadStdin.js";
import { Operation } from "./types.js";

const prefix = "./bin/cli";

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

    s += "Global options are:\n" + HELP.map((line) => `  ${line}\n`).join("");

    void writeStderr(s).then(() => process.exit(2));
  };

  const { globalOptions, remainingArgs } = getGlobalOptions(argv);
  GlobalOptionsSingleton.set(globalOptions);

  const getter = () =>
    getDropboxClient().then((dbx) => retrier(dbx, globalOptions));

  const op = operations.find(({ verb }) => verb === remainingArgs[0]);
  if (op) {
    op.handler(
      getter,
      remainingArgs.splice(1),
      globalOptions,
      async () => await usageFail(op.verb),
    ).catch((err: Error) => {
      console.error({ err, stack: err.stack });
      process.exit(1);
    });
  } else void usageFail();
};
