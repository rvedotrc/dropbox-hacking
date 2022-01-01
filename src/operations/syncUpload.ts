import { DropboxProvider, Handler } from "../types";
import * as upload from "../sync/upload";

const verb = "sync-upload";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  usageFail: () => void
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

  if (argv.length !== 2) usageFail();
  const localPath = argv[0];
  const dropboxPath = argv[1];

  return upload
    .main(dbxp, dropboxPath, localPath, dryRun, withDelete)
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] LOCAL_PATH DROPBOX_PATH`;

export default { verb, handler, argsHelp };
