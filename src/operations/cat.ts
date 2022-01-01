import { DropboxProvider, Handler } from "../types";
import * as https from "https";

const verb = "cat";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  usageFail: () => void
): Promise<void> => {
  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const dbx = await dbxp();
  const response = (await dbx.filesGetTemporaryLink({ path })).result;

  process.stderr.write(JSON.stringify(response.metadata) + "\n");

  https.get(response.link, {}, (res) => {
    res.on("error", (err) => {
      console.error(err);
      process.exit(1);
    });
    res.pipe(process.stdout).on("end", () => {
      console.debug("end");
      process.exit(0);
    });
  });
};

const argsHelp = `DROPBOX_PATH`;

export default { verb, handler, argsHelp };
