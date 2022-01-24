import { DropboxProvider, GlobalOptions, Handler } from "../types";
import * as download from "../components/sync/download";
import { processOptions } from "../options";

const verb = "sync-download";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";
const CHECK_CONTENT = "--check-content";
const REMOTE_FILTER = "--remote-filter";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let dryRun = false;
  let withDelete = false;
  let checkContentHash = false;

  argv = processOptions(argv, {
    [DELETE]: () => (withDelete = true),
    [DRY_RUN]: () => (dryRun = true),
    [CHECK_CONTENT]: () => (checkContentHash = true),
  });

  let remoteFilter = undefined;
  if (argv.length >= 2 && argv[0] === REMOTE_FILTER) {
    remoteFilter = new RegExp(argv[1]);
    argv = argv.slice(2);
  }

  if (argv.length !== 2) usageFail();

  const dropboxPath = argv[0];
  const localPath = argv[1];

  return download
    .main({
      dbxp,
      dropboxPath,
      localPath,
      dryRun,
      withDelete,
      checkContentHash,
      globalOptions,
      remoteFilter,
    })
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] [${CHECK_CONTENT}] [${REMOTE_FILTER} REGEX] DROPBOX_PATH LOCAL_PATH`;

export default { verb, handler, argsHelp };
