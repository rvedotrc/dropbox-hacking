import { Operation } from "./types";
import { getDropboxClient } from "./auth";

import catOperation from "./operations/cat";
import contentHashStdinOperation from "./operations/contentHashStdin";
import cpOperation from "./operations/cp";
import lsOperation from "./operations/ls";
import mkdirOperation from "./operations/mkdir";
import mvOperation from "./operations/mv";
import rmOperation from "./operations/rm";
import syncUploadOperation from "./operations/syncUpload";
import uploadStdinOperation from "./operations/uploadStdin";

const prefix = "./bin/cli";

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
  syncUploadOperation,
  uploadStdinOperation,
];

export const usageFail = (verb?: string): void => {
  process.stderr.write("Usage:\n");

  for (const op of operations) {
    if (verb === undefined || verb === op.verb) {
      process.stderr.write(`  ${prefix} ${op.verb} ${op.argsHelp}\n`);
    }
  }

  process.exit(2);
};

export default async (argv: string[]): Promise<void> => {
  const op = operations.find(({ verb }) => verb === argv[0]);
  if (op) {
    op.handler(getDropboxClient, argv.splice(1));
  } else usageFail();
};
