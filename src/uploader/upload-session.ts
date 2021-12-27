import { Dropbox, files } from "dropbox";
import stream = require("node:stream");
import SessionPartWritable from "./session-part-writable";

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
          const partPromises: Promise<void>[] = [];

          const writable = SessionPartWritable(
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
                    console.debug(
                      `non-final part for offset=${offset} completed`
                    );
                  })
                  .catch((err) => {
                    console.error(`Error from append offset=${offset}`, err);
                    reject(err);
                  })
              );
            },
            (chunk, offset) => {
              console.debug(
                `final chunk length=${chunk.length} offset=${offset}`
              );

              if (chunk.length > 0 || offset === 0) {
                partPromises.push(
                  dbx
                    .filesUploadSessionAppendV2({
                      cursor: { session_id: sessionId, offset },
                      contents: chunk,
                      close: true,
                    })
                    .then(() => {
                      console.debug(
                        `final part for offset=${offset} completed`
                      );
                    })
                );
                offset += chunk.length;
              }

              Promise.all(partPromises).then(() => {
                console.debug(`all parts completed, finish, offset=${offset}`);

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
                    console.error(
                      `Error from finish offset=${offset}`,
                      JSON.stringify(err.error)
                    );
                    reject(err);
                  });
              });
            }
          );

          readable.pipe(writable);
        })
    );
