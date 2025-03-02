import type { IOHandler } from "./types.js";

export const transportAsJson =
  <I, O>(underlying: IOHandler<string, string>): IOHandler<I, O> =>
  (reader) => {
    const underlyingWriter = underlying({
      receive: (message) => reader.receive(JSON.parse(message) as I),
      close: () => reader.close(),
    });

    return {
      send: (message) => underlyingWriter.send(JSON.stringify(message)),
      close: () => underlyingWriter.close(),
    };
  };
