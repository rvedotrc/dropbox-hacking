import type { files } from "dropbox";

import type { Context } from "../../context";

export type ThumbnailFetcher = (args: {
  rev: string;
  size: files.ThumbnailSize;
}) => Promise<{ base64JPEG: string } | null>;

export const nullThumbnailFetcher = (): ThumbnailFetcher => () =>
  Promise.resolve(null);

export const singleThumbnailFetcher =
  (context: Context): ThumbnailFetcher =>
  (args) =>
    context.dropboxClient.then((dbx) =>
      dbx
        .filesGetThumbnailBatch({
          entries: [{ path: `rev:${args.rev}`, size: args.size }],
        })
        .then((r) =>
          r.status === 200 &&
          r.result.entries.length === 1 &&
          r.result.entries[0][".tag"] === "success" &&
          r.result.entries[0].metadata.rev === args.rev
            ? { base64JPEG: r.result.entries[0].thumbnail }
            : null,
        ),
    );

export const batchingThumbnailFetcher = (
  context: Context,
  maxWait = 250,
  maxBatchSize = 25,
): ThumbnailFetcher => {
  const waiting: {
    req: files.ThumbnailArg;
    resolve: (value: Awaited<ReturnType<ThumbnailFetcher>>) => void;
    reject: (error: unknown) => void;
  }[] = [];

  let timer: NodeJS.Timeout | undefined;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;

    const copy = waiting.splice(0);
    if (copy.length === 0) return;

    console.debug(
      `Fetching from Dropbox API: `,
      copy.map((t) => t.req.path),
    );

    context.dropboxClient
      .then((dbx) =>
        dbx.filesGetThumbnailBatch({ entries: copy.map((t) => t.req) }),
      )
      .then((r) => {
        if (r.status !== 200) {
          const error = new Error(`Got a ${r.status} not a 200`);
          copy.forEach((t) => t.reject(error));
          return;
        }

        copy.forEach((c, i) => {
          const e = r.result.entries[i];
          if (e[".tag"] === "success") {
            c.resolve({ base64JPEG: e.thumbnail });
          } else {
            c.reject(new Error("Unsuccessful thumbnail result"));
          }
        });
      });
  };

  return (req) =>
    new Promise<Awaited<ReturnType<ThumbnailFetcher>>>((resolve, reject) => {
      if (waiting.length === 0) timer = setTimeout(flush, maxWait);
      waiting.push({
        req: { path: `rev:${req.rev}`, size: req.size },
        resolve,
        reject,
      });
      if (waiting.length === maxBatchSize) flush();
    });
};
