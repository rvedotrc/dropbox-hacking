import { DropboxProvider } from "../types";
import { usageFail } from "../cli";
import uploadSession from "../upload-session";
import * as fs from "fs";

const verb = "upload-file";

// Does a "mkdir -p" on the destination structure

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 2) usageFail(verb);
  const localPath = argv[0];
  const dropboxPath = argv[1];

  // Streaming; can handle larger (up to 350GB) files

  uploadSession(dbxp(), dropboxPath, fs.createReadStream(localPath))
    .then((value) => {
      process.stdout.write(JSON.stringify(value) + "\n");
      // console.info(value.result);
      process.exit(0);
    })
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
};

const argsHelp = "LOCAL_PATH DROPBOX_PATH";

export default { verb, handler, argsHelp };
