import { Handler } from "../types";
import * as fs from "fs";
import { files } from "dropbox";
import { selectUploader } from "dropbox-hacking-uploader";
import {
  DropboxProvider,
  formatTime,
  GlobalOptions,
  writeStdout,
} from "dropbox-hacking-util";

const verb = "upload-stdin";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  if (argv.length !== 1) usageFail();
  const dropboxPath = argv[0];

  const stat = fs.fstatSync(process.stdin.fd);
  const uploader = selectUploader(stat.isFile() ? stat.size : undefined);

  const commitInfo: files.CommitInfo = {
    path: dropboxPath,
    mode: { ".tag": "overwrite" },
  };

  if (stat.isFile()) {
    commitInfo.client_modified = formatTime(stat.mtime);
  }

  const dbx = await dbxp();

  uploader(dbx, commitInfo, process.stdin, globalOptions)
    .then((metadata) => writeStdout(JSON.stringify(metadata) + "\n"))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "DROPBOX_PATH";

export default { verb, handler, argsHelp };
