import { DropboxProvider } from "../types";
import { usageFail } from "../cli";
import uploadSession from "../upload-session";
import uploadSingle, { MAX_SIZE as MAX_SINGLE_SIZE } from "../upload-single";
import * as fs from "fs";

const verb = "upload-stdin";

// Does a "mkdir -p" on the destination structure

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(verb);
  const dropboxPath = argv[0];

  const stat = fs.fstatSync(process.stdin.fd);
  const isSmall = stat.isFile() && stat.size <= MAX_SINGLE_SIZE;
  const uploader = isSmall ? uploadSingle : uploadSession;

  uploader(dbxp(), dropboxPath, process.stdin)
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

const argsHelp = "DROPBOX_PATH";

export default { verb, handler, argsHelp };
