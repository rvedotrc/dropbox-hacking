import { Dropbox } from "dropbox";
import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import * as engine from "../sync/engine";

const verb = "sync-download";

// Does a "mkdir -p" on the destination structure

const syncActionHandler = (
  _dbx: Dropbox,
  syncAction: engine.SyncAction
): Promise<void> => {
  console.debug(JSON.stringify(syncAction));
  return Promise.resolve();
};

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 2) usageFail(verb);

  let dryRun = false;
  if (argv[0] === "--dry-run") {
    dryRun = true;
    argv.shift();
  }

  const dropboxPath = argv[0];
  const localPath = argv[1];

  return engine
    .run(dbxp, dropboxPath, localPath, dryRun, syncActionHandler)
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = "DROPBOX_PATH LOCAL_PATH";

export default { verb, handler, argsHelp };
