import { Dropbox, files } from "dropbox";
import { DropboxProvider } from "../types";
import dropboxListing, { Item as RemoteItem } from "../sync/dropbox-listing";
import localListing, {
  DirectoryItem,
  FileItem,
  Item as LocalItem,
} from "../sync/local-listing";

// Does a "mkdir -p" on the destination structure

type LocalAndRemoteItems = {
  local: LocalItem[];
  remote?: Action["remote"];
};

export type Action =
  | {
      tag: "file";
      local?: FileItem;
      remote?: { relativePath: string; metadata: files.FileMetadataReference };
    }
  | {
      tag: "directory";
      local?: DirectoryItem;
      remote?: {
        relativePath: string;
        metadata: files.FolderMetadataReference;
      };
    };

export type SyncAction = {
  action?: Action;
  warnings?: string[];
  errors?: string[];
};

const listLocalAndRemote = (args: {
  dbxp: DropboxProvider;
  dropboxPath: string;

  localPath: string;
  recurse: boolean;
}): Promise<{ dbx: Dropbox; map: Map<string, LocalAndRemoteItems> }> => {
  const { dbxp, dropboxPath, localPath, recurse } = args;
  const promiseOfDbx = dbxp();

  return Promise.all([
    localListing(localPath, recurse),
    promiseOfDbx.then((dbx) => dropboxListing(dbx, dropboxPath, recurse)),
    promiseOfDbx,
  ]).then(([localItems, dropboxItems, dbx]) => {
    const map = new Map<string, LocalAndRemoteItems>();

    for (const localItem of localItems) {
      const key = localItem.relativePath.toLowerCase();

      const pair = map.get(key);
      if (pair) pair.local.push(localItem);
      else
        map.set(key, {
          local: [localItem],
        });
    }

    if (dropboxPath === "") {
      // Dropbox does not provide metadata for the root, so we synthesise it
      dropboxItems.push({
        relativePath: "",
        metadata: {
          [".tag"]: "folder",
          id: "",
          name: "",
          path_display: "",
          path_lower: "",
        },
      });
    }

    for (const remoteItem of dropboxItems) {
      if (!remoteIsFile(remoteItem) && !remoteIsDirectory(remoteItem)) continue;
      if (remoteItem.metadata.path_lower === undefined) continue;

      const key = remoteItem.relativePath.toLowerCase();

      const pair = map.get(key);
      if (pair) pair.remote = remoteItem;
      else
        map.set(key, {
          local: [],
          remote: remoteItem,
        });
    }

    const payload = Array.from(map.entries()).map(([key, pair]) => ({
      key,
      value: { remote: null, ...pair },
    }));

    console.log(JSON.stringify(payload));

    return { map, dbx };
  });
};

const localIsFile = (item: LocalItem): item is FileItem => item.tag === "file";
const localIsDirectory = (item: LocalItem): item is DirectoryItem =>
  item.tag === "directory";

type RemoteFileItem = {
  relativePath: RemoteItem["relativePath"];
  metadata: RemoteItem["metadata"] & { ".tag": "file" };
};

type RemoteFolderItem = {
  relativePath: RemoteItem["relativePath"];
  metadata: RemoteItem["metadata"] & { ".tag": "folder" };
};

const remoteIsFile = (item: RemoteItem): item is RemoteFileItem =>
  item.metadata[".tag"] === "file";
const remoteIsDirectory = (item: RemoteItem): item is RemoteFolderItem =>
  item.metadata[".tag"] === "folder";

const syncActionFor = (key: string, items: LocalAndRemoteItems): SyncAction => {
  const { local, remote } = items;

  if (local.length > 1) {
    const names = local.map((item) => item.path).sort();
    return {
      errors: [
        `Found names which differ only in case (must be a case-sensitive filesystem). Not handling this yet. ${names.join(
          " "
        )}`,
      ],
    };
  }

  const localItem = local[0];

  // local: nothing, file, directory, something else (e.g. symlink)
  // remote: nothing, file, directory

  if (!localItem) {
    if (!remote)
      throw "Somehow ended up being called with no local and no remote";

    if (remoteIsFile(remote)) {
      return {
        action: {
          tag: "file",
          local: undefined,
          remote,
        },
      };
    } else {
      return {
        action: {
          tag: "directory",
          local: undefined,
          remote,
        },
      };
    }
  } else if (localIsFile(localItem)) {
    if (remote && remoteIsDirectory(remote)) {
      return {
        errors: [
          `${remote.metadata.path_display} is a directory but ${localItem.path} is a file`,
        ],
      };
    } else {
      return {
        action: {
          tag: "file",
          local: localItem,
          remote,
        },
      };
    }
  } else if (localIsDirectory(localItem)) {
    if (remote && remoteIsFile(remote)) {
      return {
        errors: [
          `${remote.metadata.path_display} is a file but ${localItem.path} is a directory`,
        ],
      };
    } else {
      return {
        action: {
          tag: "directory",
          local: localItem,
          remote,
        },
      };
    }
  } else {
    // e.g. symlink
    if (!remote) {
      return {
        warnings: [`Ignoring non-file non-directory ${localItem.path}`],
      };
    } else {
      return {
        errors: [
          remoteIsFile(remote)
            ? `${remote.metadata.path_display} is a file but ${localItem.path} is to be ignored`
            : `${remote.metadata.path_display} is a directory but ${localItem.path} is to be ignored`,
        ],
      };
    }
  }
};

const showWarnings = (syncActions: SyncAction[]): void => {
  for (const syncAction of syncActions) {
    if (syncAction.warnings) {
      process.stderr.write(syncAction.warnings.join("\n") + "\n");
    }
  }
};

const showErrors = (syncActions: SyncAction[]): boolean => {
  let anyErrors = false;

  for (const syncAction of syncActions) {
    if (syncAction.errors && syncAction.errors.length > 0) {
      anyErrors = true;
      process.stderr.write(syncAction.errors.join("\n") + "\n");
    }
  }

  return anyErrors;
};

export const showErrorsAndWarnings = (
  syncActions: SyncAction[]
): { hasErrors: boolean } => {
  showWarnings(syncActions);
  return { hasErrors: showErrors(syncActions) };
};

export const calculate = async (
  dbxp: DropboxProvider,
  dropboxPath: string,
  localPath: string
): Promise<{ syncActions: SyncAction[]; dbx: Dropbox }> =>
  listLocalAndRemote({
    dbxp,
    localPath,
    dropboxPath,
    recurse: true,
  }).then(({ dbx, map }) => {
    const sortedEntries = Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    const syncActions = sortedEntries.map(([key, items]) =>
      syncActionFor(key, items)
    );

    return { syncActions, dbx };
  });
