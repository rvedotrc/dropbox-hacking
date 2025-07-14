import type { IOHandler } from "./types.js";

export const spy = <I, O>(
  underlying: IOHandler<I, O>,
  label: string,
): IOHandler<I, O> => ({
  connect: (receiver) => {
    console.log(`spy [${label}]: connecting`);

    const underlyingSender = underlying.connect({
      receive: (message) => {
        console.log(`spy [${label}]: received`, message);
        receiver.receive(message);
      },
      close: () => {
        console.log(`spy [${label}]: receiver-close`);
        receiver.close();
      },
    });

    console.log(`spy [${label}]: connected`);
    return {
      send: (message) => {
        console.log(`spy [${label}]: send`, message);
        underlyingSender.send(message);
      },
      close: () => {
        console.log(`spy [${label}]: sender-close`);
        underlyingSender.close();
      },
    };
  },
});
