import { Dropbox, files } from "dropbox";
import { cancel, GlobalOptions } from "@blaahaj/dropbox-hacking-util";

export type ListerArgs = (
  | {
      tag: "from_start";
      args: files.ListFolderArg;
    }
  | {
      tag: "from_latest";
      args: files.ListFolderArg;
    }
  | {
      tag: "cursor";
      args: files.ListFolderContinueArg;
    }
) & { tail: boolean };

export const lister = (args: {
  dbx: Dropbox;
  listing: ListerArgs;
  onItem: (
    item:
      | files.FileMetadataReference
      | files.FolderMetadataReference
      | files.DeletedMetadataReference,

    //  files.ListFolderResult["entries"][number]
  ) => Promise<void>;
  onCursor?: (cursor: string) => Promise<void>;
  onPause?: (cursor: string) => Promise<void>;
  onResume?: () => Promise<void>;
  globalOptions: GlobalOptions;
}): { promise: Promise<"complete" | "cancelled">; cancel: () => void } => {
  const { dbx, listing, onItem, onCursor, onPause, onResume, globalOptions } =
    args;

  // Synthesise a response if it seems to take forever. Is this problem
  // *specific* to the long poll, or simply more likely, because that's
  // where most of the time is spent?
  const doLongPoll = (
    longPollArgs: files.ListFolderLongpollArg,
    timeoutMillis: number,
  ): Promise<files.ListFolderLongpollResult> => {
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const primaryPromise = dbx.filesListFolderLongpoll(longPollArgs);
    let requestPromise = primaryPromise.then((r) => r.result);

    if (globalOptions.debugPoll)
      requestPromise = requestPromise.then(
        (r) => {
          console.debug("longpoll returned", r);
          return r;
        },
        (e) => {
          console.debug("longpoll threw", e);
          throw e;
        },
      );

    const timeoutPromise = new Promise<files.ListFolderLongpollResult>(
      (resolve) => {
        timer = setTimeout(() => {
          if (globalOptions.debugPoll)
            console.debug("long poll took too long, synthesising a response");
          cancel(primaryPromise);
          resolve({ changes: false });
        }, timeoutMillis);
      },
    );

    return Promise.race([requestPromise, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  };

  let cancelled = false;

  const pauseAndFollowCursor = async (
    cursor: string,
  ): Promise<Promise<"complete" | "cancelled">> => {
    if (onPause) {
      if (globalOptions.debugLister) console.debug(`lister: await onPause`);
      await onPause(cursor);
    }

    while (!cancelled) {
      // If stdout was buffered, we'd flush it here
      if (globalOptions.debugPoll) console.debug("long poll");

      const r = await doLongPoll({ cursor }, 300000);

      if (globalOptions.debugPoll) console.debug(`poll result`, r);
      if (r.changes) break;

      const backoff = r.backoff;

      if (backoff) {
        if (globalOptions.debugPoll) console.debug(`sleep ${r.backoff}s`);
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
      }
    }

    if (cancelled) {
      if (globalOptions.debugLister) console.debug(`lister: cancelled`);
      return "cancelled";
    }

    // if (globalOptions.debugPoll) console.debug("continue");
    if (onResume) {
      if (globalOptions.debugLister) console.debug(`lister: await onResume`);
      await onResume();
    }

    if (globalOptions.debugLister)
      console.debug(`lister: continuing from cursor`);
    const page = (await dbx.filesListFolderContinue({ cursor })).result;
    return handlePage(page);
  };

  const handlePage = async (
    page: files.ListFolderResult,
  ): Promise<"complete" | "cancelled"> => {
    if (globalOptions.debugLister)
      console.debug(
        `lister: handlePage ${page.entries.length} entries, cursor=${page.cursor}`,
      );

    for (const item of page.entries) {
      if (globalOptions.debugLister)
        console.debug(`lister: await onItem`, item);
      await onItem(item);
    }

    if (onCursor) {
      if (globalOptions.debugLister) console.debug(`lister: await onCursor`);
      await onCursor(page.cursor);
    }

    if (cancelled) {
      if (globalOptions.debugLister) console.debug(`lister: cancelled`);
      return "cancelled";
    }

    if (page.has_more) {
      if (globalOptions.debugLister)
        console.debug(`lister: has_more, requesting next page`);
      return dbx
        .filesListFolderContinue({ cursor: page.cursor })
        .then((r) => handlePage(r.result));
    } else if (listing.tail) {
      if (globalOptions.debugLister)
        console.debug(`lister: !has_more, polling tail`);
      return pauseAndFollowCursor(page.cursor);
    } else {
      if (globalOptions.debugLister)
        console.debug(`lister: !has_more, !polling => complete`);
      return Promise.resolve("complete");
    }
  };

  const firstPage = () => {
    if (listing.tag === "cursor")
      return dbx.filesListFolderContinue(listing.args);

    if (listing.tag === "from_start") return dbx.filesListFolder(listing.args);

    return dbx
      .filesListFolderGetLatestCursor(listing.args)
      .then((r) => dbx.filesListFolderContinue({ cursor: r.result.cursor }));
  };

  return {
    promise: firstPage().then((r) => handlePage(r.result)),
    cancel: () => (cancelled = true),
  };
};
