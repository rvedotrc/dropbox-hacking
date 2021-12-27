import stream = require("node:stream");

const PART_SIZE = 4194304;

export default (
  onNonFinalPart: (chunk: Buffer, offset: number) => void,
  onFinalPart: (chunk: Buffer, offset: number) => void
): stream.Writable => {
  const writable = new stream.Writable();
  let bufferedSize = 0;
  const buffers: Buffer[] = [];
  let offset = 0;

  writable._write = (chunk: Buffer, encoding, callback): void => {
    console.debug(`_write length=${chunk.length}`);
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
    console.debug(`After chunk, bufferedSize=${bufferedSize} offset=${offset}`);

    callback();
  };

  writable.on("finish", () => {
    console.debug(`finish bufferedSize=${bufferedSize} offset=${offset}`);
    onFinalPart(Buffer.concat(buffers), offset);
  });

  return writable;
};
