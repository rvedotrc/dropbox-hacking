import { Dropbox, files } from "dropbox";

export default async (
  dbx: Dropbox,
  args: {
    path: string;
    tail: boolean;
    latest: boolean;
    recursive: boolean;
    cursor?: string;
  },
  onItem: (item: files.ListFolderResult["entries"][0]) => Promise<void>,
  onCursor?: (cursor: string) => Promise<void>,
  onPause?: () => Promise<void>,
  onResume?: () => Promise<void>
): Promise<void> => {
  const followCursor = async (cursor: string): Promise<void> => {
    if (onCursor) await onCursor(cursor);
    if (onPause) await onPause();

    while (true) {
      // If stdout was buffered, we'd flush it here
      // console.debug("long poll");
      const r = (await dbx.filesListFolderLongpoll({ cursor, timeout: 300 }))
        .result;

      if (r.changes) break;

      const backoff = r.backoff;

      if (backoff) {
        console.debug(`sleep ${r.backoff}s`);
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
      }
    }

    // console.debug("continue");
    if (onResume) await onResume();
    const page = (await dbx.filesListFolderContinue({ cursor })).result;
    return handlePage(page);
  };

  const handlePage = async (page: files.ListFolderResult): Promise<void> => {
    for (const item of page.entries) {
      await onItem(item);
    }

    if (page.has_more) {
      if (onCursor) await onCursor(page.cursor);
      return dbx
        .filesListFolderContinue({ cursor: page.cursor })
        .then((r) => handlePage(r.result));
    } else if (args.tail) {
      return followCursor(page.cursor);
    } else {
      if (onCursor) await onCursor(page.cursor);
      return Promise.resolve();
    }
  };

  if (args.latest) {
    const cursor = (
      await dbx.filesListFolderGetLatestCursor({
        path: args.path,
        recursive: args.recursive,
      })
    ).result.cursor;
    return followCursor(cursor);
  } else if (args.cursor) {
    return followCursor(args.cursor);
  } else {
    const firstPage = await dbx.filesListFolder({
      path: args.path,
      recursive: args.recursive,
    });
    return handlePage(firstPage.result);
  }
};
