import { Dropbox, files } from "dropbox";
import { GlobalOptions } from "../../types";
import { PromiseLimiter } from "../../util/promises/promiseLimiter";
import { simplePromiseRetrier } from "../../util/promises/simplePromiseRetrier";
import FileMetadata = files.FileMetadata;
import { MediainfoData } from "./types";
import { spawn } from "node:child_process";

export type Fetcher = {
  fetch: (item: FileMetadata) => Promise<MediainfoData>;
};

const remoteMediainfo = async (
  uri: string,
  timeoutMillis: number
): Promise<MediainfoData> => {
  let timer: NodeJS.Timeout | undefined;

  return await new Promise<MediainfoData>((resolve, reject) => {
    let output = "";

    const child = spawn("mediainfo", ["--full", "--output=JSON", uri], {
      shell: false,
      stdio: [null, "pipe", "inherit"],
      serialization: "json",
    });

    child.on("error", (error) => {
      console.error({ mediainfo_error: error });
      child.kill();
      reject(`child error: ${error}`);
    });

    // Is it guaranteed that child.exit happens only after ALL of the child.stdout.data?
    child.on("exit", (code, signal) => {
      console.log({ mediainfo_exit: { code, signal } });
      if (code === 0 && signal === null) {
        try {
          const data = JSON.parse(output);
          resolve(new MediainfoData(data));
        } catch (error) {
          reject(`Error parsing mediainfo output: ${error}`);
        }
      } else {
        reject(`mediainfo failed with code ${code} signal ${signal}`);
      }
    });

    // child.on("close", (code, signal) =>
    //   console.log({ mediainfo_close: { code, signal } })
    // );

    child.stdout.on("data", (data) => (output += data.toString()));

    child.stdout.on("error", (error) => {
      console.error({ mediainfo_stdout_error: error });
      child.kill();
      reject(`child stdout error: ${error}`);
    });

    // child.stdout.on("end", () => console.log({ mediainfo_stdout_end: true }));

    // child.stdout.on("close", () =>
    //   console.log({ mediainfo_stdout_close: true })
    // );

    timer = setTimeout(() => {
      child.kill();
      reject("Timed out, mediainfo killed");
    }, timeoutMillis);
  }).finally(() => timer && clearTimeout(timer));
};

export default (
  dbx: Dropbox,
  limiter: PromiseLimiter<MediainfoData>,
  globalOptions: GlobalOptions,
  timeoutMillis = 300000
): Fetcher => ({
  fetch: (item: FileMetadata): Promise<MediainfoData> => {
    return limiter.submit(
      () =>
        dbx
          .filesGetTemporaryLink({ path: `rev:${item.rev}` })
          .then((r) => r.result.link)
          .then((uri) =>
            simplePromiseRetrier(
              () => remoteMediainfo(uri, timeoutMillis),
              `remote mediainfo from ${item.path_lower}`
            )
          ),
      "mediainfo-extractor"
    );
  },
});
