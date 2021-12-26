import { DropboxProvider } from "../types";
import * as https from "https";
import { usageFail } from "../cli";

const verb = "cat";

const handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  const response = (await dbxp().filesGetTemporaryLink({ path })).result;

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
