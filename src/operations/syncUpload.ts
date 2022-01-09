import { DropboxProvider, GlobalOptions, Handler } from "../types";
import * as upload from "../sync/upload";
import { processOptions } from "../options";

const verb = "sync-upload";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";
const CHECK_CONTENT = "--check-content";

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

  if (argv.length !== 2) usageFail();
  const localPath = argv[0];
  const dropboxPath = argv[1];

  return upload
    .main(
      dbxp,
      dropboxPath,
      localPath,
      dryRun,
      withDelete,
      checkContentHash,
      globalOptions
    )
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] [${CHECK_CONTENT}] LOCAL_PATH DROPBOX_PATH`;

export default { verb, handler, argsHelp };
