import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import dropboxListing from "../sync/dropbox-listing";
import localListing from "../sync/local-listing";

const verb = "sync-download";

// Does a "mkdir -p" on the destination structure

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 2) usageFail(verb);
  const dropboxPath = argv[0];
  const localPath = argv[1];

  const dbx = await dbxp();

  await dropboxListing(dbx, dropboxPath, true).then((items) => {
    if (items === "not_found") {
      console.debug("remote not found");
    } else {
      items.forEach((item) => console.debug(JSON.stringify(item)));
    }
  });

  await localListing(localPath, true).then((items) => {
    if (items === "not_found") {
      console.debug("local not found");
    } else {
      items.forEach((item) => console.debug(JSON.stringify(item)));
    }
  });
};

const argsHelp = "DROPBOX_PATH LOCAL_PATH";

export default { verb, handler, argsHelp };
