import { DropboxProvider, GlobalOptions, Handler } from "../types";
import * as download from "../components/sync/download";
import { processOptions } from "../options";
import { AlternateProvider } from "../components/sync/download";
import localListing, { Item } from "../components/sync/local-listing";
import makeContentHash from "../components/uploader/make-content-hash";
import * as fs from "fs";

const verb = "sync-download";
const DRY_RUN = "--dry-run";
const DELETE = "--delete";
const CHECK_CONTENT = "--check-content";
const REMOTE_FILTER = "--remote-filter";
const ALTERNATE = "--alternate";

const makeContentHashFetcher = () => {
  const cache = new Map<string, Promise<string>>();

  return (localPath: string): Promise<string> => {
    let promise = cache.get(localPath);
    if (promise) return promise;

    promise = makeContentHash(fs.createReadStream(localPath));
    cache.set(localPath, promise);
    return promise;
  };
};

const makeAlternateProvider = (localDirs: string[]): AlternateProvider => {
  let promiseOfLocalBySize: Promise<Map<number, Item[]>> | undefined =
    undefined;

  const contentHashFetcher = makeContentHashFetcher();

  return (remote) => {
    const remoteContentHash = remote.content_hash;
    if (!remoteContentHash) return Promise.resolve(undefined);

    promiseOfLocalBySize ||= Promise.all(
      localDirs.map((localDir) => localListing(localDir, true))
    ).then((listings) => {
      const bySize = new Map<number, Item[]>();

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
  usageFail: () => void
): Promise<void> => {
  let dryRun = false;
  let withDelete = false;
  let checkContentHash = false;

  argv = processOptions(argv, {
    [DELETE]: () => (withDelete = true),
    [DRY_RUN]: () => (dryRun = true),
    [CHECK_CONTENT]: () => (checkContentHash = true),
  });

  let remoteFilter = undefined;
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
