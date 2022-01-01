import { DropboxProvider, Handler } from "../types";

const verb = "cp";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  usageFail: () => void
): Promise<void> => {
  if (argv.length !== 2) usageFail();
  const fromPath = argv[0];
  const toPath = argv[1];

  const dbx = await dbxp();

  dbx
    .filesCopyV2({ from_path: fromPath, to_path: toPath })
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
