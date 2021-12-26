import { Dropbox, Error, files } from "dropbox";
import * as fs from "fs";

type DropboxProvider = () => Dropbox;
type Operation = {
  verb: string;
  handler: (dbxp: DropboxProvider, argv: string[]) => void;
  argsHelp: string;
};
const envVar = "DROPBOX_CREDENTIALS_PATH";
const prefix = "./bin/cli";

const UPLOAD_STDIN = "upload-stdin";
const DELETE = "delete";
const LS = "ls";

const uploadStdin = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(UPLOAD_STDIN);
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

const deleteHandler = (dbxp: DropboxProvider, argv: string[]): void => {
  if (argv.length !== 1) usageFail(DELETE);
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

const ls = async (dbxp: DropboxProvider, argv: string[]): Promise<void> => {
  let recursive = false;
  let tail = false;
  let latest = false;

  while (true) {
    if (argv[0] === "--recursive") {
      recursive = true;
      argv.shift();
      continue;
    }
    if (argv[0] === "--tail") {
      tail = true;
      argv.shift();
      continue;
    }
    if (argv[0] === "--latest") {
      latest = true;
      argv.shift();
      continue;
    }

    break;
  }

  if (argv.length !== 1) usageFail(LS);
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

      if (r.backoff) {
        // console.debug(`sleep ${r.backoff}s`);
        await new Promise((resolve) => setTimeout(resolve, r.backoff * 1000));
      }
    }

    // console.debug("continue");
    page = (await dbx.filesListFolderContinue({ cursor: page.cursor })).result;
  }

  // console.debug("done");
  process.exit(0);
};

const operations: Operation[] = [
  { verb: UPLOAD_STDIN, handler: uploadStdin, argsHelp: "DROPBOX_PATH" },
  { verb: DELETE, handler: deleteHandler, argsHelp: "DROPBOX_PATH" },
  { verb: LS, handler: ls, argsHelp: "[--recursive] [--tail] [--latest] PATH" },
];

const usageFail = (verb?: string) => {
  process.stderr.write("Usage:\n");

  for (const op of operations) {
    if (verb === undefined || verb === op.verb) {
      process.stderr.write(`  ${prefix} ${op.verb} ${op.argsHelp}\n`);
    }
  }

  process.exit(2);
};

const getDropboxClient = (): Dropbox => {
  const credentialsPath = process.env[envVar];
  if (!credentialsPath) {
    process.stderr.write(`Fatal: ${envVar} is not set\n`);
    process.exit(2);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath).toString());

  return new Dropbox({ accessToken: credentials.token });
};

export default async (argv: string[]): Promise<void> => {
  const op = operations.find(({ verb }) => verb === argv[0]);
  if (op) {
    op.handler(getDropboxClient, argv.splice(1));
  } else usageFail();
};
