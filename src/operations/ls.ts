import { DropboxProvider, GlobalOptions, Handler } from "../types";
import { processOptions } from "../options";
import { writeStdout } from "../util";
import lister from "../lister";

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

  const dbx = await dbxp();

  const totals = {
    files: 0,
    folders: 0,
    totalSize: 0,
  };

  await lister(
    dbx,
    {
      path,
      recursive,
      tail,
      latest,
    },
    async (object) => {
      if (object[".tag"] === "file") {
        ++totals.files;
        totals.totalSize += object.size;
      }
      if (object[".tag"] === "folder") ++totals.folders;

      await writeStdout(JSON.stringify(object) + "\n");
    }
  );

  if (showTotals) {
    // console.debug("totals");
    await writeStdout(JSON.stringify({ totals }) + "\n");
  }

  // console.debug("done");
  process.exit(0);
};

const argsHelp = `[${RECURSIVE}] [${TOTALS} | ${TAIL} [${LATEST}]] DROPBOX_PATH`;

export default { verb, handler, argsHelp };
