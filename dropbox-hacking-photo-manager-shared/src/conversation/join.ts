import type { IOHandler } from "./types.js";

export const join = <A, B>(
  readsAWritesB: IOHandler<A, B>,
  readsBWritesA: IOHandler<B, A>,
) => {
  const readA = {
    receive: (message: A) => writeA.send(message),
    close: () => writeA.close(),
    inspect: () => ``,
  };

  const readB = {
    receive: (message: B) => writeB.send(message),
    close: () => writeB.close(),
    inspect: () => ``,
  };

  const writeA = readsBWritesA.connect(readB);
  const writeB = readsAWritesB.connect(readA);
};
