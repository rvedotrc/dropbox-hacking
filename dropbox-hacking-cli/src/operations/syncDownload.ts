import { download, localListing } from "@blaahaj/dropbox-hacking-sync";
import { makeContentHash } from "@blaahaj/dropbox-hacking-uploader";
import {
  DropboxProvider,
  GlobalOptions,
  processOptions,
} from "@blaahaj/dropbox-hacking-util";
import * as fs from "fs";

import { Handler } from "../types.js";

const verb = "sync-download";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";
const CHECK_CONTENT = "--check-content";
const REMOTE_FILTER = "--remote-filter";
const ALTERNATE = "--alternate";

const makeContentHashFetcher = () => {
  const cache = new Map<string, Promise<string>>();

  return (localPath: string): Promise<string> => {
    const promise1 = cache.get(localPath);
    if (promise1 !== undefined) return promise1;

    const promise2 = makeContentHash(fs.createReadStream(localPath));
    cache.set(localPath, promise2);
    return promise2;
  };
};

const makeAlternateProvider = (
  localDirs: string[],
): download.AlternateProvider => {
  let promiseOfLocalBySize:
    | Promise<Map<number, localListing.Item[]>>
    | undefined = undefined;

  const contentHashFetcher = makeContentHashFetcher();

  return (remote) => {
    const remoteContentHash = remote.content_hash;
    if (!remoteContentHash) return Promise.resolve(undefined);

    promiseOfLocalBySize ||= Promise.all(
      localDirs.map((localDir) => localListing.default(localDir, true)),
    ).then((listings) => {
      const bySize = new Map<number, localListing.Item[]>();

      for (const listing of listings) {
        for (const item of listing) {
          const items = bySize.get(item.stat.size);
          if (items === undefined) {
            bySize.set(item.stat.size, [item]);
          } else {
            items.push(item);
          }
        }
      }

      return bySize;
    });

    return promiseOfLocalBySize.then(async (map) => {
      const sameSize = map.get(remote.size) || [];

      console.log({ n: map.size, remoteSize: remote.size, sameSize });

      for (const candidate of sameSize) {
        const localContentHash = await contentHashFetcher(candidate.path);
        if (localContentHash === remoteContentHash) return candidate.path;
      }

      return undefined;
    });
  };
};

const handler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void,
): Promise<void> => {
  let dryRun = false;
  let withDelete = false;
  let checkContentHash = false;

  argv = processOptions(argv, {
    [DELETE]: () => (withDelete = true),
    [DRY_RUN]: () => (dryRun = true),
    [CHECK_CONTENT]: () => (checkContentHash = true),
  });

  let remoteFilter: RegExp | undefined = undefined;
  const alternateSources: string[] = [];

  while (true) {
    if (argv.length >= 2 && argv[0] === REMOTE_FILTER) {
      remoteFilter = new RegExp(argv[1]);
      argv = argv.slice(2);
      continue;
    }

    if (argv.length >= 2 && argv[0] === ALTERNATE) {
      alternateSources.push(argv[1]);
      argv = argv.slice(2);
      continue;
    }

    break;
  }

  if (argv.length !== 2) usageFail();

  const dropboxPath = argv[0];
  const localPath = argv[1];

  return download
    .main({
      dbxp,
      dropboxPath,
      localPath,
      dryRun,
      withDelete,
      checkContentHash,
      globalOptions,
      remoteFilter,
      alternateProvider: makeAlternateProvider(alternateSources),
    })
    .then((success) => process.exit(success ? 0 : 1));
};

const argsHelp = `[${DRY_RUN}] [${DELETE}] [${CHECK_CONTENT}] [${REMOTE_FILTER} REGEX] [${ALTERNATE} LOCAL_PATH]... DROPBOX_PATH LOCAL_PATH`;

export default { verb, handler, argsHelp };
