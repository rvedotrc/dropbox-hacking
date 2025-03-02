import { files, type DropboxResponseError } from "dropbox";
import {
  DropboxProvider,
  GlobalOptions,
  writeStdout,
} from "dropbox-hacking-util";

import { Handler } from "../types.js";

const verb = "rm";

// Recursive!

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  _globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const dbx = await dbxp();

  dbx
    .filesDeleteV2({ path })
    .then((response) => writeStdout(JSON.stringify(response.result) + "\n"))
    .catch((err: DropboxResponseError<files.DeleteError>) => {
      if (
        err.status === 409 &&
        err.error[".tag"] === "path_lookup" &&
        err.error.path_lookup[".tag"] === "not_found"
      )
        return undefined;

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw err;
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "DROPBOX_PATH (recursive!)";

export default { verb, handler, argsHelp };
