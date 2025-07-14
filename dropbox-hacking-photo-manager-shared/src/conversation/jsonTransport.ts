import type { JSONValue } from "@blaahaj/json";

import type { IOHandler, Receiver, Sender } from "./types.js";

export const transportAsJson = <I extends JSONValue, O extends JSONValue>(
  stringConnector: IOHandler<string, string>,
): IOHandler<I, O> => {
  const outerConnector: IOHandler<I, O> = {
    connect: (objectReceiver) => {
      const stringReceiver: Receiver<string> = {
        receive: (message) => objectReceiver.receive(JSON.parse(message) as I),
        close: () => objectReceiver.close(),
        inspect: () =>
          `<transportAsJson wrapper for ${objectReceiver.inspect()}>`,
      };

      const stringSender = stringConnector.connect(stringReceiver);

      const objectSender: Sender<O> = {
        send: (message) => stringSender.send(JSON.stringify(message)),
        close: () => stringSender.close(),
        inspect: () =>
          `<transportAsJson wrapper for ${stringSender.inspect()}>`,
      };

      return objectSender;
    },
    inspect: () => `<transportAsJson over ${stringConnector.inspect()}>`,
  };

  return outerConnector;
};
