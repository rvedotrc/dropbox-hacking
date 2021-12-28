import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";

const verb = "mkdir";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  const dbx = await dbxp();

  dbx
    .filesCreateFolderBatch({ paths: [path] })
    .then((response) => {
      const result = response.result;
      if (result[".tag"] === "async_job_id") {
        const asyncJobId = result.async_job_id;

        return dbx
          .filesCreateFolderBatchCheck({ async_job_id: asyncJobId })
          .then((r2) => {
            console.debug({ asyncJobId, r2 });
            process.exit(0);
          });
      } else if (result[".tag"] === "complete") {
        console.log(JSON.stringify({ entries: result.entries }));
        process.exit(0);
      } else {
        console.log(JSON.stringify({ result }));
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};

const argsHelp = "DROPBOX_PATH";

export default { verb, handler, argsHelp };
