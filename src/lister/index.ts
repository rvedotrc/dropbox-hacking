import { Dropbox, files } from "dropbox";

export type ListerArgs =
  | {
      tag: "path";
      path: string;
      recursive: boolean;
      latest: boolean;
      tail: boolean;
    }
  | {
      tag: "cursor";
      cursor: string;
      tail: boolean;
    };

export default (args: {
  dbx: Dropbox;
  listing: ListerArgs;
  onItem: (item: files.ListFolderResult["entries"][0]) => Promise<void>;
  onCursor?: (cursor: string) => Promise<void>;
  onPause?: (cursor: string) => Promise<void>;
  onResume?: () => Promise<void>;
}): { promise: Promise<"complete" | "cancelled">; cancel: () => void } => {
  const { dbx, listing, onItem, onCursor, onPause, onResume } = args;
  let cancelled = false;

  const pauseAndFollowCursor = async (
    cursor: string
  ): Promise<Promise<"complete" | "cancelled">> => {
    if (onPause) await onPause(cursor);

    while (!cancelled) {
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

    if (cancelled) return "cancelled";

    // console.debug("continue");
    if (onResume) await onResume();
    const page = (await dbx.filesListFolderContinue({ cursor })).result;
    return handlePage(page);
  };

  const handlePage = async (
    page: files.ListFolderResult
  ): Promise<"complete" | "cancelled"> => {
    for (const item of page.entries) {
      await onItem(item);
    }

    if (onCursor) await onCursor(page.cursor);

    if (cancelled) return "cancelled";

    if (page.has_more) {
      return dbx
        .filesListFolderContinue({ cursor: page.cursor })
        .then((r) => handlePage(r.result));
    } else if (listing.tail) {
      return pauseAndFollowCursor(page.cursor);
    } else {
      return Promise.resolve("complete");
    }
  };

  const firstPage = () => {
    if (listing.tag === "cursor")
      return dbx.filesListFolderContinue({ cursor: listing.cursor });

    if (!listing.latest)
      return dbx.filesListFolder({
        path: listing.path,
        recursive: listing.recursive,
      });

    return dbx
      .filesListFolderGetLatestCursor({
        path: listing.path,
        recursive: listing.recursive,
      })
      .then((r) => dbx.filesListFolderContinue({ cursor: r.result.cursor }));
  };

  return {
    promise: firstPage().then((r) => handlePage(r.result)),
    cancel: () => (cancelled = true),
  };
};
