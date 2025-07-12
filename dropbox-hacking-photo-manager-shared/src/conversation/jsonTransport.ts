import type { JSONValue } from "@blaahaj/json";

import type { IOHandler } from "./types.js";

export const transportAsJson =
  <I extends JSONValue, O extends JSONValue>(
    underlying: IOHandler<string, string>,
  ): IOHandler<I, O> =>
  (receiver) => {
    const underlyingSender = underlying({
      receive: (message) => receiver.receive(JSON.parse(message) as I),
      close: () => receiver.close(),
    });

    return {
      send: (message) => underlyingSender.send(JSON.stringify(message)),
      close: () => underlyingSender.close(),
    };
  };
