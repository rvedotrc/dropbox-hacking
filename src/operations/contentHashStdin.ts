import { DropboxProvider, GlobalOptions, Handler } from "../types";
import makeContentHash from "../components/uploader/make-content-hash";
import { writeStdout } from "../util/logging";

const verb = "content-hash-stdin";

const handler: Handler = async (
  _dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  if (argv.length !== 0) usageFail();

  return makeContentHash(process.stdin)
    .then((hash) => writeStdout(hash + "\n"))
    .then(() => process.exit(0))
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
};

const argsHelp = "";

export default { verb, handler, argsHelp };
