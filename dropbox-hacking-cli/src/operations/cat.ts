import {
  DropboxProvider,
  GlobalOptions,
  processOptions,
} from "dropbox-hacking-util";
import * as https from "https";

import { Handler } from "../types";

const verb = "cat";

const SHOW_LINK = "--show-link";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  let showLink = false;

  argv = processOptions(argv, {
    [SHOW_LINK]: () => (showLink = true),
  });

  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const dbx = await dbxp();
  const response = (await dbx.filesGetTemporaryLink({ path })).result;

  process.stderr.write(JSON.stringify(response.metadata) + "\n");

  if (showLink) return console.log(response.link);

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

const argsHelp = `[${SHOW_LINK}] DROPBOX_PATH`;

export default { verb, handler, argsHelp };
