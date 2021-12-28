import stream = require("node:stream");
import fixedChunkStream from "./fixed-chunk-stream";
import * as crypto from "crypto";

const PART_SIZE = 4194304; // 4 MB

export default (readable: stream.Readable): Promise<string> =>
  new Promise<string>((resolve, _reject) => {
    const overallHash = crypto.createHash("sha256");

    const onChunk = (buffer: Buffer): void => {
      const thisPartHash = crypto.createHash("sha256");
      thisPartHash.update(buffer);
      overallHash.update(thisPartHash.digest());
    };

    const onEnd = (): void => {
      resolve(overallHash.digest("hex"));
    };

    // FIXME: this needs to report errors
    fixedChunkStream(PART_SIZE, readable, onChunk, onEnd);
  });
