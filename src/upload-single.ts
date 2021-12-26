import { Dropbox, files } from "dropbox";
import stream = require("node:stream");

export const MAX_SIZE = 150_000_000;

export default (
  dbx: Dropbox,
  path: string,
  readable: stream.Readable
): Promise<files.FileMetadata> =>
  new Promise<files.FileMetadata>((resolve) => {
    // Dumb version, where the whole contents goes into memory,
    // and the upload will fail if > 150MB.

    const buffers: Buffer[] = [];

    readable.on("data", (buffer) => {
      // console.debug(buffer);
      buffers.push(buffer);
    });

    readable.on("error", (err) => {
      console.error(err);
      process.exit(1);
    });

    readable.on("end", () => {
      const contents = Buffer.concat(buffers);
      // console.debug(`end, length=${contents.length}`);

      resolve(
        dbx
          .filesUpload({
            path,
            contents,
            mode: { ".tag": "overwrite" },
          })
          .then((r) => r.result)
      );
    });
  });
