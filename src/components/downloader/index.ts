import { Dropbox, files } from "dropbox";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import { parseTime } from "../../util/time";
import { makePromiseLimiter } from "../../util/promises/promiseLimiter";

const defaultLimiter = makePromiseLimiter(5);

export default (args: {
  dbx: Dropbox;
  local: string;
  remote: files.FileMetadata;
}): Promise<void> => {
  const { dbx, local, remote } = args;

  const id = randomUUID().toString();
  const tmpLocal = `${local}.tmp.dbxsync.${id}`;
  const mtime = parseTime(remote.client_modified);

  // const log =
  //   <T>(message: string) =>
  //   (result: T): T => {
  //     console.debug(`download ${local}: ${message}`);
  //     return result;
  //   };

  return defaultLimiter
    .submit(() => {
      const w = fs.createWriteStream(tmpLocal, { mode: 0o644, flags: "wx" });

      let timer: NodeJS.Timeout | undefined;

      return dbx
        .filesGetTemporaryLink({ path: `rev:${remote.rev}` })
        .then((r) => r.result.link)
        .then((uri) =>
          new Promise<void>((resolve, reject) => {
            const req = https
              .get(uri, {}, (res: http.IncomingMessage) => {
                res.pipe(w);
                res.on("error", reject);
                res.on("end", resolve);
                w.on("error", reject);
              })
              .on("error", reject)
              .on("abort", reject)
              .on("timeout", reject);
            timer = setTimeout(() => {
              req.destroy(new Error("Timeout hit, aborting"));
            }, 300 * 1000);
          }).finally(() => timer && clearTimeout(timer))
        )
        .then(() => fs.promises.utimes(tmpLocal, mtime, mtime))
        .then(() => fs.promises.rename(tmpLocal, local))
        .finally(() => w.close())
        .finally(() => fs.unlink(tmpLocal, () => {}));
    }, `download ${remote.path_display} => ${local}`)
    .then();
};
