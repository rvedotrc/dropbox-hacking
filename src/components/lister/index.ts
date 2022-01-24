import { Dropbox, files } from "dropbox";
import { GlobalOptions } from "../../types";
import { cancel } from "../../retry-and-rate-limit";

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

export default (args: {
  dbx: Dropbox;
  listing: ListerArgs;
  onItem: (item: files.ListFolderResult["entries"][0]) => Promise<void>;
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
    timeoutMillis: number
  ): Promise<files.ListFolderLongpollResult> => {
    let timer: NodeJS.Timer | undefined = undefined;

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
        }
      );

    const timeoutPromise = new Promise<files.ListFolderLongpollResult>(
      (resolve) => {
        timer = setTimeout(() => {
          if (globalOptions.debugPoll)
            console.debug("long poll took too long, synthesising a response");
          cancel(primaryPromise);
          resolve({ changes: false });
        }, timeoutMillis);
      }
    );

    return Promise.race([requestPromise, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  };

  let cancelled = false;

  const pauseAndFollowCursor = async (
    cursor: string
  ): Promise<Promise<"complete" | "cancelled">> => {
    if (onPause) await onPause(cursor);

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

    if (cancelled) return "cancelled";

    // if (globalOptions.debugPoll) console.debug("continue");
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
