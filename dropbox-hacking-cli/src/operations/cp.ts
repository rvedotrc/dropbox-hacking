import {
  DropboxProvider,
  GlobalOptions,
  writeStdout,
} from "dropbox-hacking-util";

import { Handler } from "../types.js";

const verb = "cp";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  _globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  if (argv.length !== 2) usageFail();
  const fromPath = argv[0];
  const toPath = argv[1];

  const dbx = await dbxp();

  dbx
    .filesCopyV2({ from_path: fromPath, to_path: toPath })
    .then((response) => writeStdout(JSON.stringify(response.result) + "\n"))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "FROM_DROPBOX_PATH TO_DROPBOX_PATH";

export default { verb, handler, argsHelp };
