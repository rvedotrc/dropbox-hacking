import { Dropbox, files } from "dropbox";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import { parseTime } from "../util";
import limiter from "../uploader/limiter";

const defaultLimiter = limiter(5);

export default (
  dbx: Dropbox,
  local: string,
  remote: files.FileMetadata
): Promise<void> => {
  const id = randomUUID().toString();
  const tmpLocal = `${local}.tmp.dbxsync.${id}`;
  const mtime = parseTime(remote.client_modified);

  const log =
    <T>(message: string) =>
    (result: T): T => {
      console.debug(`download ${local}: ${message}`);
      return result;
    };

  return defaultLimiter
    .submit(() => {
      const w = fs.createWriteStream(tmpLocal, { mode: 0o600, flags: "wx" });

      return dbx
        .filesGetTemporaryLink({ path: `rev:${remote.rev}` })
        .then(log(`got link`))
        .then((r) => r.result.link)
        .then(
          (uri) =>
            new Promise<void>((resolve, reject) => {
              https.get(uri, {}, (res: http.IncomingMessage) => {
                console.log(`download ${local}: piping`);
                res.pipe(w);
                res.on("error", reject);
                res.on("end", resolve);
                w.on("error", reject);
              });
            })
        )
        .then(log(`utimes`))
        .then(() => fs.promises.utimes(tmpLocal, mtime, mtime))
        .then(log(`chmod`))
        .then(() => fs.promises.chmod(tmpLocal, 0o644))
        .then(log(`rename`))
        .then(() => fs.promises.rename(tmpLocal, local))
        .then(log(`finally`))
        .finally(() => w.close())
        .finally(() => fs.unlink(tmpLocal, () => {}));
    }, `download ${remote.path_display} => ${local}`)
    .then();
};
