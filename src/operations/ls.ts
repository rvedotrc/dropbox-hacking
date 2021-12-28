import { DropboxProvider } from "../types";
import { files } from "dropbox";
import { usageFail } from "../cli";

const verb = "ls";

const RECURSIVE = "--recursive";
const TAIL = "--tail";
const LATEST = "--latest";

const handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  let recursive = false;
  let tail = false;
  let latest = false;

  while (true) {
    if (argv[0] === RECURSIVE) {
      recursive = true;
      argv.shift();
      continue;
    }
    if (argv[0] === TAIL) {
      tail = true;
      argv.shift();
      continue;
    }
    if (argv[0] === LATEST) {
      latest = true;
      argv.shift();
      continue;
    }

    break;
  }

  if (argv.length !== 1) usageFail(verb);
  const path = argv[0];

  const listFolderArg: files.ListFolderArg = {
    path,
    recursive,
  };

  const dbx = dbxp();

  const handlePage = (result: files.ListFolderResult) => {
    // console.debug(`showing entries=${result.entries.length}`);
    let s = "";
    for (const object of result.entries) {
      s = s.concat(JSON.stringify(object) + "\n");
    }
    process.stdout.write(s);
  };

  let page: files.ListFolderResult;

  if (latest) {
    // console.debug("get latest cursor");
    // Eww
    page = {
      cursor: (await dbx.filesListFolderGetLatestCursor(listFolderArg)).result
        .cursor,
      entries: [],
      has_more: true,
    };
  } else {
    // console.debug("get first page");
    page = (await dbx.filesListFolder(listFolderArg)).result;
  }

  while (true) {
    handlePage(page);

    if (page.has_more) {
      // console.debug("continue");
      page = (await dbx.filesListFolderContinue({ cursor: page.cursor }))
        .result;
      continue;
    }

    if (!tail) break;

    while (true) {
      // If stdout was buffered, we'd flush it here
      // console.debug("long poll");
      const r = (
        await dbx.filesListFolderLongpoll({ cursor: page.cursor, timeout: 300 })
      ).result;

      if (r.changes) break;

      const backoff = r.backoff;

      if (backoff) {
        // console.debug(`sleep ${r.backoff}s`);
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
      }
    }

    // console.debug("continue");
    page = (await dbx.filesListFolderContinue({ cursor: page.cursor })).result;
  }

  // console.debug("done");
  process.exit(0);
};

const argsHelp = `[${RECURSIVE}] [${TAIL}] [${LATEST}] DROPBOX_PATH`;

export default { verb, handler, argsHelp };
