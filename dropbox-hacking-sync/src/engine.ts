import { Dropbox, files } from "dropbox";
import {
  DropboxProvider,
  GlobalOptions,
  writeStderr,
} from "@blaahaj/dropbox-hacking-util";

import dropboxListing, { Item as RemoteItem } from "./dropbox-listing.js";
import localListing, {
  DirectoryItem,
  FileItem,
  Item as LocalItem,
} from "./local-listing.js";

// Does a "mkdir -p" on the destination structure

type LocalAndRemoteItems = {
  local: LocalItem[];
  remote?: Action["remote"];
};

type RemoteFileItem = {
  relativePath: RemoteItem["relativePath"];
  metadata: RemoteItem["metadata"] & { ".tag": "file" };
};

type RemoteFolderItem = {
  relativePath: RemoteItem["relativePath"];
  metadata: RemoteItem["metadata"] & { ".tag": "folder" };
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

const localIsFile = (item: LocalItem): item is FileItem => item.tag === "file";

const localIsDirectory = (item: LocalItem): item is DirectoryItem =>
  item.tag === "directory";

const remoteIsFile = (item: RemoteItem): item is RemoteFileItem =>
  item.metadata[".tag"] === "file";

const remoteIsDirectory = (item: RemoteItem): item is RemoteFolderItem =>
  item.metadata[".tag"] === "folder";

export const calculate = async (
  dbxp: DropboxProvider,
  dropboxPath: string,
  localPath: string,
  globalOptions: GlobalOptions,
): Promise<{ syncActions: SyncAction[]; dbx: Dropbox }> => {
  const listLocalAndRemote = (
    recurse: boolean,
  ): Promise<{ dbx: Dropbox; map: Map<string, LocalAndRemoteItems> }> => {
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
        if (!remoteIsFile(remoteItem) && !remoteIsDirectory(remoteItem))
          continue;
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

      if (globalOptions.debugSync) {
        // const payload = Array.from(map.entries()).map(([key, pair]) => ({
        //   key,
        //   value: { remote: null, ...pair },
        // }));
        const payload = {};

        console.log(JSON.stringify(payload));
      }

      return { map, dbx };
    });
  };

  const syncActionFor = (
    _key: string,
    items: LocalAndRemoteItems,
  ): SyncAction => {
    const { local, remote } = items;

    if (local.length > 1) {
      const names = local.map((item) => item.path).sort();
      return {
        errors: [
          `Found names which differ only in case (must be a case-sensitive filesystem). Not handling this yet. ${names.join(
            " ",
          )}`,
        ],
      };
    }

    const localItem = local[0];

    // local: nothing, file, directory, something else (e.g. symlink)
    // remote: nothing, file, directory

    if (!localItem) {
      if (!remote)
        throw new Error(
          "Somehow ended up being called with no local and no remote",
        );

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

  return listLocalAndRemote(true).then(({ dbx, map }) => {
    const sortedEntries = Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    const syncActions = sortedEntries.map(([key, items]) =>
      syncActionFor(key, items),
    );

    return { syncActions, dbx };
  });
};

export const showErrorsAndWarnings = async (
  syncActions: SyncAction[],
): Promise<{ hasErrors: boolean }> => {
  for (const syncAction of syncActions) {
    if (syncAction.warnings) {
      await writeStderr(syncAction.warnings.join("\n") + "\n");
    }
  }

  let hasErrors = false;

  let s = "";

  for (const syncAction of syncActions) {
    if (syncAction.errors && syncAction.errors.length > 0) {
      hasErrors = true;
      s += syncAction.errors.join("\n") + "\n";
    }
  }

  if (s !== "") await writeStderr(s);

  return { hasErrors };
};
