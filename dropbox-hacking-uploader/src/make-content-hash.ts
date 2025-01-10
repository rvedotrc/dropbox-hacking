import stream from "node:stream";
import * as crypto from "crypto";

import fixedChunkStream from "./fixed-chunk-stream.js";

const PART_SIZE = 4194304; // 4 MB

export const makeContentHash = (readable: stream.Readable): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const overallHash = crypto.createHash("sha256");

    const onChunk = (buffer: Buffer): void => {
      const thisPartHash = crypto.createHash("sha256");
      thisPartHash.update(buffer);
      overallHash.update(thisPartHash.digest());
    };

    const onEnd = (): void => {
      resolve(overallHash.digest("hex"));
    };

    fixedChunkStream(PART_SIZE, readable, onChunk, onEnd, reject);
  });
