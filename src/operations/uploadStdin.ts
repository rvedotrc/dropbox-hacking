import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import { selectUploader } from "../uploader";
import * as fs from "fs";
import { files } from "dropbox";
import { formatTime } from "../util";

const verb = "upload-stdin";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 1) usageFail(verb);
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

  uploader(dbx, commitInfo, process.stdin)
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
