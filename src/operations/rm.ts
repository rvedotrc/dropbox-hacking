import { DropboxProvider } from "../types";
import { Error, files } from "dropbox";
import { usageFail } from "../cli";

const verb = "rm";

const handler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  dbxp()
    .filesDeleteV2({ path })
    .then((response) => {
      process.stdout.write(JSON.stringify(response.result) + "\n");
      process.exit(0);
    })
    .catch((uploadErr: Error<files.UploadError>) => {
      console.log(uploadErr);
    });
};

const argsHelp = "PATH";

export default { verb, handler, argsHelp };
