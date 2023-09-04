import { Operation } from "./types";

import catOperation from "./operations/cat";
import {
  getDropboxClient,
  getGlobalOptions,
  GlobalOptionsSingleton,
  retrier,
  writeStderr,
  HELP,
} from "dropbox-hacking-util";
import contentHashStdinOperation from "./operations/contentHashStdin";
import cpOperation from "./operations/cp";
import lsOperation from "./operations/ls";
import mkdirOperation from "./operations/mkdir";
import mvOperation from "./operations/mv";
import rmOperation from "./operations/rm";
import syncDownloadOperation from "./operations/syncDownload";
import syncUploadOperation from "./operations/syncUpload";
import uploadStdinOperation from "./operations/uploadStdin";

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

    writeStderr(s).then(() => process.exit(2));
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
    ).catch((err) => {
      console.error({ err, stack: err.stack });
      process.exit(1);
    });
  } else usageFail();
};
