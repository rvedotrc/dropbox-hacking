import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";

const verb = "rm";

// Recursive!

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  const dbx = await dbxp();

  dbx
    .filesDeleteV2({ path })
    .then((response) => {
      process.stdout.write(JSON.stringify(response.result) + "\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "DROPBOX_PATH (recursive!)";

export default { verb, handler, argsHelp };
