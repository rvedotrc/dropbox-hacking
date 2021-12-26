import { DropboxProvider } from "../types";
import { usageFail } from "../cli";

const verb = "mv";

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 2) usageFail(verb);
  const fromPath = argv[0];
  const toPath = argv[1];

  const dbx = dbxp();

  dbx
    .filesMoveV2({ from_path: fromPath, to_path: toPath })
    .then((response) => {
      process.stdout.write(JSON.stringify(response.result) + "\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "FROM_DROPBOX_PATH TO_DROPBOX_PATH";

export default { verb, handler, argsHelp };
