import type { IOHandler } from "./types.js";

export const spy =
  <I, O>(underlying: IOHandler<I, O>, label: string): IOHandler<I, O> =>
  (reader) => {
    console.log(`spy [${label}]: connecting`);

    const underlyingWriter = underlying({
      receive: (message) => {
        console.log(`spy [${label}]: received`, message);
        reader.receive(message);
      },
      close: () => {
        console.log(`spy [${label}]: reader-close`);
        reader.close();
      },
    });

    console.log(`spy [${label}]: connected`);
    return {
      send: (message) => {
        console.log(`spy [${label}]: send`, message);
        underlyingWriter.send(message);
      },
      close: () => {
        console.log(`spy [${label}]: writer-close`);
        underlyingWriter.close();
      },
    };
  };
