import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { writeStdout } from "../util/logging";

const verb = "rm";

// Recursive!

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const dbx = await dbxp();

  dbx
    .filesDeleteV2({ path })
    .then((response) => writeStdout(JSON.stringify(response.result) + "\n"))
    .catch((err) => {
      if (
        err.status === 409 &&
        err.error?.error_summary.includes("path_lookup/not_found")
      )
        return undefined;

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
