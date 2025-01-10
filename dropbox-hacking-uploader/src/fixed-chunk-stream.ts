import stream from "node:stream";

export default (
  chunkSize: number,
  readable: stream.Readable,
  onChunk: (chunk: Buffer) => void,
  onEnd: () => void,
  onError: (err: Error) => void,
): void => {
  if (isNaN(chunkSize)) throw new Error("Invalid chunkSize");

  chunkSize = Math.floor(chunkSize);
  if (chunkSize < 1) throw new Error("Invalid chunkSize");

  let bufferedSize = 0;
  const buffers: Buffer[] = [];

  readable.on("end", () => {
    // console.debug(`finish bufferedSize=${bufferedSize}`);
    if (bufferedSize > 0) {
      onChunk(Buffer.concat(buffers));
    }
    onEnd();
  });

  const addChunk = (chunk: Buffer): void => {
    // console.debug(`got chunk length=${chunk.length}`);
    if (chunk.length === 0) return;

    const neededToFill = chunkSize - bufferedSize;
    if (neededToFill <= 0) throw new Error("Overrun!");

    if (chunk.length > neededToFill) {
      // Split into two writes
      console.debug(
        `Splitting: bufferedSize=${bufferedSize} chunk=${chunk.length} neededToFill=${neededToFill}`,
      );

      addChunk(chunk.slice(0, neededToFill));
      addChunk(chunk.slice(neededToFill));
      return;
    }

    buffers.push(chunk);
    bufferedSize += chunk.length;
    // console.debug(`After chunk, bufferedSize=${bufferedSize}`);

    if (bufferedSize === chunkSize) {
      const wholeBuffer = Buffer.concat(buffers);
      buffers.length = 0;
      bufferedSize = 0;
      onChunk(wholeBuffer);
    }
  };

  readable.on("data", addChunk);
  readable.on("error", onError);
};
