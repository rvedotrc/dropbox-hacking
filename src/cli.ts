import { Operation } from "./types";
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
import retryAndRateLimit from "./retry-and-rate-limit";

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

  const usageFail = (verb?: string): void => {
    process.stderr.write("Usage:\n");

    for (const op of operations) {
      if (verb === undefined || verb === op.verb) {
        process.stderr.write(`  ${prefix} ${op.verb} ${op.argsHelp}\n`);
      }
    }

    process.exit(2);
  };

  const getter = () => getDropboxClient().then(retryAndRateLimit);

  const op = operations.find(({ verb }) => verb === argv[0]);
  if (op) {
    op.handler(getter, argv.splice(1), () => usageFail(op.verb)).catch(
      (err) => {
        console.error({ err, stack: err.stack });
        process.exit(1);
      }
    );
  } else usageFail();
};
