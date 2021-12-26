import { Dropbox, files } from "dropbox";
import stream = require("node:stream");

const PART_SIZE = 4194304;

const makeWritable = (
  onNonFinalPart: (chunk: Buffer, offset: number) => void,
  onFinalPart: (chunk: Buffer, offset: number) => void
): stream.Writable => {
  const writable = new stream.Writable();
  let bufferedSize = 0;
  const buffers: Buffer[] = [];
  let offset = 0;

  writable._write = (chunk: Buffer, encoding, callback): void => {
    console.debug("_write", chunk);
    if (chunk.length === 0) return;

    // Already got exactly enough for a part, and there's more data
    if (bufferedSize === PART_SIZE) {
      // Non-final part
      const wholeBuffer = Buffer.concat(buffers);

      buffers.length = 0;
      bufferedSize = 0;
      const oldOffset = offset;
      offset += PART_SIZE;

      onNonFinalPart(wholeBuffer, oldOffset);

      // partPromises.push(
      //     dbx
      //         .filesUploadSessionAppendV2({
      //             cursor: {
      //                 session_id: sessionId,
      //                 offset,
      //                 contents: wholeBuffer,
      //             },
      //             close: false,
      //         })
      //         .then((partResult) => {
      //             console.debug(
      //                 `part result offset=${offset} size=${wholeBuffer.length} ${partResult}`
      //             );
      //             return partResult;
      //         })
      // );
    }

    const neededToFill = PART_SIZE - bufferedSize;
    if (neededToFill <= 0) throw "Overrun!";

    if (chunk.length > neededToFill) {
      // Split into two writes
      console.debug(
        `Splitting: bufferedSize=${bufferedSize} chunk=${chunk.length} neededToFill=${neededToFill}`
      );

      writable._write(chunk.slice(0, neededToFill), encoding, (error) => {
        if (error) callback(error);
        else writable._write(chunk.slice(neededToFill), encoding, callback);
      });

      return;
    }

    buffers.push(chunk);
    bufferedSize += chunk.length;
    console.debug(`After chunk, bufferedSize=${bufferedSize}`);

    callback();
  };

  writable.on("finish", () => {
    console.debug("finish");
    onFinalPart(Buffer.concat(buffers), offset);
  });

  return writable;
};

export default (
  dbx: Dropbox,
  path: string,
  readable: stream.Readable
): Promise<files.FileMetadata> =>
  dbx
    .filesUploadSessionStart({
      session_type: { ".tag": "concurrent" },
    })
    .then((v) => v.result.session_id)
    .then(
      (sessionId) =>
        new Promise<files.FileMetadata>((resolve, reject) => {
          // const writable = new stream.Writable();

          const partPromises: Promise<void>[] = [];

          const writable = makeWritable(
            (chunk, offset) => {
              console.debug("non-final chunk", chunk, offset);
              partPromises.push(
                dbx
                  .filesUploadSessionAppendV2({
                    cursor: { session_id: sessionId, offset },
                    contents: chunk,
                    close: false,
                  })
                  .then(() => {
                    console.debug(`append for offset=${offset} completed`);
                  })
                  .catch((err) => {
                    console.error(`Error from append offset=${offset}`, err);
                    reject(err);
                  })
              );
            },
            (chunk, offset) => {
              console.debug("final chunk", chunk, offset);

              if (chunk.length > 0) {
                partPromises.push(
                  dbx
                    .filesUploadSessionAppendV2({
                      cursor: { session_id: sessionId, offset },
                      contents: chunk,
                      close: true,
                    })
                    .then((r) => {
                      console.debug("final part OK", offset, r);
                    })
                );
              }

              Promise.all(partPromises).then(() => {
                console.debug("all non-final parts completed, finish");

                return dbx
                  .filesUploadSessionFinish({
                    cursor: {
                      session_id: sessionId,
                      offset,
                    },
                    commit: { path },
                  })
                  .then((r) => {
                    console.debug("finish completed", r);
                    resolve(r.result);
                  })
                  .catch((err) => {
                    console.error(`Error from finish offset=${offset}`, err);
                    reject(err);
                  });
              });
            }
          );

          readable.pipe(writable);
        })
    );
