import { Dropbox, files } from "dropbox";

type Items = files.ListFolderResult["entries"];

export default (
  dbx: Dropbox,
  path: string,
  recursive: boolean
): Promise<Items | "not_found"> =>
  dbx.filesListFolder({ path, recursive }).then(
    (r) => {
      let items: Items = [];
      items = items.concat(...r.result.entries);

      const followCursor = (hasMore: boolean, cursor: string): Promise<void> =>
        hasMore
          ? dbx.filesListFolderContinue({ cursor }).then((r2) => {
              items = items.concat(...r2.result.entries);
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
              .then((metadata) => [metadata.result]);
          if (tag == "not_found") return "not_found";
        }
      }

      throw err;
    }
  );
