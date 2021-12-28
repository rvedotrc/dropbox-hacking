import { DropboxProvider, Handler } from "../types";
import { usageFail } from "../cli";
import * as fs from "fs";
import { Dropbox, DropboxResponseError, files } from "dropbox";
import * as util from "util";
import { formatTime } from "../util";
import contentHash from "../uploader/content-hash";
import { selectUploader } from "../uploader";
import * as path from "path";

const verb = "sync-upload";

// Does a "mkdir -p" on the destination structure

const dropboxMetadata = (dbx: Dropbox, dropboxPath: string) =>
  dbx.filesGetMetadata({ path: dropboxPath }).then(
    (r) => r.result,
    (err: DropboxResponseError<unknown>): "not_found" => {
      console.error("error", JSON.stringify(err, null, 2));
      if (err.status === 409) return "not_found";
      throw err;
    }
  );

const calculateContentHash = (localPath: string): Promise<string> => {
  console.debug(`calculateContentHash ${localPath}`);
  return contentHash(fs.createReadStream(localPath, { autoClose: true }));
};

const unconditionalUpload = (args: {
  dbx: Dropbox;
  localPath: string;
  dropboxPath: string;
  stat: fs.Stats;
}): Promise<files.Metadata> => {
  const commitInfo: files.CommitInfo = {
    path: args.dropboxPath,
    client_modified: formatTime(args.stat.mtime),
    mode: { ".tag": "overwrite" },
    autorename: false,
  };

  const readable = fs.createReadStream(args.localPath, { autoClose: true });

  return selectUploader(args.stat.size)(args.dbx, commitInfo, readable);
};

// Local file, exists; dropbox file, exists.
// Compare sizes and mtimes and (optionally) checksum.
const conditionalUpload = (args: {
  dbx: Dropbox;
  localPath: string;
  dropboxPath: string;
  stat: fs.Stats;
  metadata: files.FileMetadata;
}): Promise<files.Metadata> =>
  Promise.resolve()
    .then(() => {
      // console.debug(args.localPath, "comparing sizes");
      if (args.stat.size !== args.metadata.size) return false;

      // console.debug(args.localPath, "comparing mtimes");
      if (formatTime(args.stat.mtime) !== args.metadata.client_modified)
        return false;

      // console.debug(args.localPath, "comparing content hashes");
      return calculateContentHash(args.localPath).then(
        (localContentHash) => localContentHash === args.metadata.content_hash
      );

      return true;
    })
    .then((isEqual) => {
      if (isEqual) return args.metadata;
      return unconditionalUpload(args);
    });

// Node has no "seek" or "rewind", so we may have to open the twice in some cases
// (once to calculate the checksum, once to actually do the upload) - either that
// or we read the whole file into memory, which obviously doesn't scale well.

// We *could* parallelise more and do the first (and sometimes only) 'open' in parallel
// with fetching the dropbox metadata, but for now, we keep things simpler.

const syncFile = (args: {
  dbx: Dropbox;
  localPath: string;
  dropboxPath: string;
  stat: fs.Stats;
}): Promise<files.Metadata | undefined> =>
  dropboxMetadata(args.dbx, args.dropboxPath).then((metadata) => {
    console.debug({
      localPath: args.localPath,
      dropboxPath: args.dropboxPath,
      stat: args.stat,
      metadata,
    });

    if (metadata !== "not_found" && metadata[".tag"] === "folder") {
      throw "Already exists, and is a folder";
    }

    if (metadata === "not_found" || metadata[".tag"] === "deleted") {
      return unconditionalUpload({ ...args });
    } else {
      return conditionalUpload({ ...args, metadata });
    }
  });

// Does NOT delete unwanted target items
// (i.e. it's like rsync without "--delete")

// This will end up doing (potentially) lots of individual "get file metadata"
// requests against dropbox. We could instead do a recursive "ls" first, and
// use that as a kind of metadata provider.

const syncDirectory = (args: {
  dbx: Dropbox;
  localPath: string;
  dropboxPath: string;
}): Promise<undefined> => {
  if (args.dropboxPath !== "" && !args.dropboxPath.startsWith("/"))
    throw `Invalid sync target; only paths are supported`;

  return fs.promises
    .readdir(args.localPath)
    .then((entries) =>
      Promise.all(
        entries.map((entry) => {
          if (entry === "." || entry === "...") return undefined;

          const localPath = path.join(args.localPath, entry);
          const dropboxPath =
            args.dropboxPath === ""
              ? `/${entry}`
              : `${args.dropboxPath.replace(/\/*$/, "")}/${entry}`;

          return syncAny({ dbx: args.dbx, localPath, dropboxPath });
        })
      )
    )
    .then(() => undefined);
};

const syncAny = (args: {
  dbx: Dropbox;
  localPath: string;
  dropboxPath: string;
}): Promise<files.Metadata | undefined> => {
  console.debug(`syncAny ${args.localPath} ${args.dropboxPath}`);

  return util
    .promisify(fs.lstat)(args.localPath)
    .then((stat) => {
      if (stat.isFile()) return syncFile({ ...args, stat });
      if (stat.isDirectory()) return syncDirectory(args);

      // symlinks, block/char special, etc
      throw "Can only sync files or directories";
    });
};

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[]
): Promise<void> => {
  if (argv.length !== 2) usageFail(verb);
  const localPath = argv[0];
  const dropboxPath = argv[1];

  const dbx = await dbxp();

  syncAny({ dbx, localPath, dropboxPath })
    .then((result) => {
      if (result) process.stdout.write(JSON.stringify(result) + "\n");
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(`${err}\n`);
      process.exit(1);
    });
};

const argsHelp = "LOCAL_PATH DROPBOX_PATH";

export default { verb, handler, argsHelp };
