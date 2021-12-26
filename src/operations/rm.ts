import { DropboxProvider } from "../types";
import { usageFail } from "../cli";

const verb = "rm";

// Recursive!

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  dbxp()
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
