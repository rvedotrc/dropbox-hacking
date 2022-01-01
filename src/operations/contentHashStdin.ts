import { DropboxProvider, Handler } from "../types";
import contentHash from "../uploader/content-hash";

const verb = "content-hash-stdin";

const handler: Handler = async (
  _dbxp: DropboxProvider,
  argv: string[],
  usageFail: () => void
): Promise<void> => {
  if (argv.length !== 0) usageFail();

  return contentHash(process.stdin)
    .then((hash) => {
      process.stdout.write(hash + "\n");
      process.exit(0);
    })
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
};

const argsHelp = "";

export default { verb, handler, argsHelp };
