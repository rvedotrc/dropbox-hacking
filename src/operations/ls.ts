import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { files } from "dropbox";
import { processOptions } from "../options";
import { writeStdout } from "../util";

const verb = "ls";

const RECURSIVE = "--recursive";
const TAIL = "--tail";
const LATEST = "--latest";
const TOTALS = "--totals";

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
): Promise<void> => {
  let recursive = false;
  let tail = false;
  let latest = false;
  let showTotals = false;

  argv = processOptions(argv, {
    [RECURSIVE]: () => (recursive = true),
    [TAIL]: () => (tail = true),
    [LATEST]: () => (latest = true),
    [TOTALS]: () => (showTotals = true),
  });

  if (latest && !tail) {
    process.stderr.write(`${LATEST} doesn't make sense without ${TAIL}\n`);
    process.exit(1);
  }

  // But maybe we could.  Continuously updating stats? Hmmm.
  if (showTotals && tail) {
    await new Promise<void>((resolve, reject) =>
      process.stderr.write(`${TOTALS} can't be used with ${TAIL}\n`, (err) =>
        err ? reject(err) : resolve()
      )
    ).then(() => process.exit(1));
  }

  if (argv.length !== 1) usageFail();
  const path = argv[0];

  const listFolderArg: files.ListFolderArg = {
    path,
    recursive,
  };

  const dbx = await dbxp();

  const totals = {
    files: 0,
    folders: 0,
    totalSize: 0,
  };

  const handlePage = async (result: files.ListFolderResult) => {
    // console.debug(`showing entries=${result.entries.length}`);
    let s = "";
    for (const object of result.entries) {
      if (object[".tag"] === "file") {
        ++totals.files;
        totals.totalSize += object.size;
      }
      if (object[".tag"] === "folder") ++totals.folders;

      s = s.concat(JSON.stringify(object) + "\n");
    }

    return writeStdout(s);
    // process.stdout.write(s);
    // console.debug(`showed entries=${result.entries.length}`);
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
    // console.debug("handle page");
    await handlePage(page);

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
        console.debug(`sleep ${r.backoff}s`);
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
      }
    }

    // console.debug("continue");
    page = (await dbx.filesListFolderContinue({ cursor: page.cursor })).result;
  }

  if (showTotals) {
    // console.debug("totals");
    await writeStdout(JSON.stringify({ totals }) + "\n");
  }

  // console.debug("done");
  process.exit(0);
};

const argsHelp = `[${RECURSIVE}] [${TOTALS} | ${TAIL} [${LATEST}]] DROPBOX_PATH`;

export default { verb, handler, argsHelp };
