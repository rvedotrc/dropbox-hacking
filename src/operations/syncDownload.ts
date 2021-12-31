import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import * as download from "../sync/download";

const verb = "sync-download";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  let dryRun = false;
  let withDelete = false;

  while (true) {
    if (argv[0] === DELETE) {
      withDelete = true;
      argv.shift();
      continue;
    }
    if (argv[0] === DRY_RUN) {
      dryRun = true;
      argv.shift();
      continue;
    }

    break;
  }

  if (argv.length !== 2) usageFail(verb);

  const dropboxPath = argv[0];
  const localPath = argv[1];

  return download
    .main(dbxp, dropboxPath, localPath, dryRun, withDelete)
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] DROPBOX_PATH LOCAL_PATH`;

export default { verb, handler, argsHelp };
