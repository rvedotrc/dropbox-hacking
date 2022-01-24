import { Dropbox, files } from "dropbox";
import { GlobalOptions } from "../types";
import { PromiseLimiter } from "../util/promises/promiseLimiter";
import { simplePromiseRetrier } from "../util/promises/simplePromiseRetrier";
import FileMetadata = files.FileMetadata;
import * as https from "https";
import * as http from "http";

export type Fetcher = {
  fetch: (item: FileMetadata) => Promise<Buffer>;
};

const first64KBOf = async (
  uri: string,
  fetchSize: number,
  timeoutMillis: number
): Promise<Buffer> => {
  let timer: NodeJS.Timeout | undefined;

  return await new Promise<Buffer>((resolve, reject) => {
    let buffer = Buffer.alloc(0);

    const headers = {
      Range: `bytes=0-${fetchSize - 1}`,
    };

    const req = https
      .get(uri, { headers }, (res: http.IncomingMessage) => {
        res.on("data", (chunk: Buffer) => {
          if (buffer.length < fetchSize) {
            buffer = Buffer.concat([
              buffer,
              chunk.slice(0, fetchSize - buffer.length),
            ]);
          }
        });
        res.on("error", reject);
        res.on("end", () => resolve(buffer));
      })
      .on("error", reject)
      .on("abort", reject)
      .on("timeout", reject);

    timer = setTimeout(() => {
      req.destroy(new Error("Timeout hit, aborting"));
    }, timeoutMillis);
  }).finally(() => timer && clearTimeout(timer));
};

export default <T>(
  dbx: Dropbox,
  limiter: PromiseLimiter<T>,
  globalOptions: GlobalOptions,
  fetchSize = 65536,
  timeoutMillis = 300000
): Fetcher => {
  return {
    fetch: (item: FileMetadata): Promise<Buffer> => {
      return dbx
        .filesGetTemporaryLink({ path: `rev:${item.rev}` })
        .then((r) => r.result.link)
        .then((uri) =>
          simplePromiseRetrier(
            () => first64KBOf(uri, fetchSize, timeoutMillis),
            `get head of ${item.path_lower}`
          )
        );
    },
  };
};
