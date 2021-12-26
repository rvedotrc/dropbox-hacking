import { DropboxProvider } from "../types";
import { usageFail } from "../cli";

const verb = "upload-stdin";

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  // Dumb version, where the whole contents goes into memory,
  // and the upload will fail if > 150MB.

  const buffers: Buffer[] = [];

  process.stdin.on("data", (buffer) => {
    // console.debug(buffer);
    buffers.push(buffer);
  });

  process.stdin.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  process.stdin.on("end", () => {
    const contents = Buffer.concat(buffers);
    // console.debug(`end, length=${contents.length}`);

    dbxp()
      .filesUpload({
        path,
        contents,
        mode: { ".tag": "overwrite" },
      })
      .then((value) => {
        process.stdout.write(JSON.stringify(value.result) + "\n");
        // console.info(value.result);
        process.exit(0);
      })
      .catch((reason) => {
        console.error(reason);
        process.exit(1);
      });
  });
};

const argsHelp = "DROPBOX_PATH";

export default { verb, handler, argsHelp };
