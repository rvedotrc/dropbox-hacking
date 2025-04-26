import { randomUUID } from "crypto";
import { Dropbox, files } from "dropbox";
import { makePromiseLimiter, parseTime } from "@blaahaj/dropbox-hacking-util";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";

const defaultLimiter = makePromiseLimiter<void>(2, "download-limiter");
const defaultMode = 0o644;
const defaultInactivityTimeout = 300 * 1000;

const downloadToFilehandle = (args: {
  dbx: Dropbox;
  remote: files.FileMetadata;
  fh: fs.promises.FileHandle;
  inactivityTimeout?: number;
  limiter?: typeof defaultLimiter;
}): Promise<void> => {
  const w = args.fh.createWriteStream();

  let timer: NodeJS.Timeout | undefined;

  return args.dbx
    .filesGetTemporaryLink({ path: `rev:${args.remote.rev}` })
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
        }, args.inactivityTimeout);
      }).finally(() => timer && clearTimeout(timer)),
    )
    .then(
      () =>
        new Promise((resolve, reject) =>
          w.close((err) => (err ? reject(err) : resolve(undefined))),
        ),
      (err) => {
        w.close(() => {
          throw err;
        });
      },
    );
};

// Download 'remote' to 'local' using 'dbx'. The download happens to a
// temporary file with mode 0o000, and is then flushed, has its mtime
// set, mode set to 0o644 (or as specified) before being renamed into
// place. The whole thing is done behind a limiter, and with an abort-
// -on-inactivity timeout.
export const downloader = (args: {
  dbx: Dropbox;
  local: string;
  remote: files.FileMetadata;
  mode?: number;
  inactivityTimeout?: number;
  limiter?: typeof defaultLimiter;
}): Promise<void> => {
  const { local, remote } = args;

  const id = randomUUID().toString();
  const tmpLocal = `${local}.tmp.dbxsync.${id}`;
  const mtime = parseTime(remote.client_modified);
  const mode = args.mode === undefined ? defaultMode : args.mode;
  const limiter = args.limiter || defaultLimiter;
  const inactivityTimeout = args.inactivityTimeout || defaultInactivityTimeout;

  return limiter.submit(
    () =>
      fs.promises
        .open(tmpLocal, "wx", 0o000)
        .then((fh) =>
          downloadToFilehandle({ ...args, inactivityTimeout, fh }).finally(
            () => void fh.close(),
          ),
        )
        .then(() => fs.promises.utimes(tmpLocal, mtime, mtime))
        .then(() => fs.promises.chmod(tmpLocal, mode))
        .then(() => fs.promises.rename(tmpLocal, local))
        .finally(() => fs.unlink(tmpLocal, () => {}))
        .then((): void => {}),
    `download ${remote.path_display} => ${local}`,
  );
};
