import { makeContentHash } from "@blaahaj/dropbox-hacking-uploader";
import {
  DropboxProvider,
  GlobalOptions,
  writeStdout,
} from "@blaahaj/dropbox-hacking-util";

import { Handler } from "../types.js";

const verb = "content-hash-stdin";

const handler: Handler = async (
  _dbxp: DropboxProvider,
  argv: string[],
  _globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  if (argv.length !== 0) usageFail();

  return makeContentHash(process.stdin)
    .then((hash) => writeStdout(hash + "\n"))
    .then(() => process.exit(0))
    .catch((reason: Error) => {
      console.error(reason);
      process.exit(1);
    })
    .then(() => undefined);
};

const argsHelp = "";

export default { verb, handler, argsHelp };
