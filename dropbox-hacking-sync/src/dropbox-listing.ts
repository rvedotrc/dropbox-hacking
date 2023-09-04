import { Dropbox, files } from "dropbox";
import FileMetadataReference = files.FileMetadataReference;
import FolderMetadataReference = files.FolderMetadataReference;
import DeletedMetadataReference = files.DeletedMetadataReference;

export type Item = {
  relativePath: string;
  metadata:
    | FileMetadataReference
    | FolderMetadataReference
    | DeletedMetadataReference;
};

const addRelativePath = (metadata: Item["metadata"], path: string): Item => {
  if (metadata.path_display === undefined) throw "Need path_display";
  return {
    relativePath: metadata.path_display.substring(path.length),
    metadata,
  };
};

export default (
  dbx: Dropbox,
  path: string,
  recursive: boolean,
): Promise<Item[]> =>
  dbx.filesListFolder({ path, recursive }).then(
    (r) => {
      let items: Item[] = [];
      const addEntries = (entries: Item["metadata"][]): void => {
        items = items.concat(...entries.map((e) => addRelativePath(e, path)));
      };
      addEntries(r.result.entries);

      const followCursor = (hasMore: boolean, cursor: string): Promise<void> =>
        hasMore
          ? dbx.filesListFolderContinue({ cursor }).then((r2) => {
              addEntries(r2.result.entries);
              return followCursor(r2.result.has_more, r2.result.cursor);
            })
          : Promise.resolve();

      return followCursor(r.result.has_more, r.result.cursor).then(() => items);
    },
    (err) => {
      if (err.status === 409) {
        if (err.error && err.error.error && err.error.error.path) {
          const tag = err.error.error.path[".tag"];
          if (tag == "not_folder")
            return dbx
              .filesGetMetadata({ path })
              .then((metadata) => [addRelativePath(metadata.result, path)]);
          if (tag == "not_found") return [];
        }
      }

      throw err;
    },
  );
