import type { JSONValue } from "@blaahaj/json";

import { generateId } from "./id.js";
import type { IOHandler, Receiver, Sender } from "./types.js";

export const transportAsJson = <I extends JSONValue, O extends JSONValue>(
  stringConnector: IOHandler<string, string>,
): IOHandler<I, O> => {
  const connectorId = generateId();

  console.debug(
    `transportAsJson(${stringConnector.inspect()}) -> ${connectorId}`,
  );

  const outerConnector: IOHandler<I, O> = {
    connect: (objectReceiver) => {
      const stringReceiverId = generateId();
      const senderId = generateId();

      const stringReceiver: Receiver<string> = {
        receive: (message) => objectReceiver.receive(JSON.parse(message) as I),
        close: () => objectReceiver.close(),
        inspect: () => stringReceiverId,
      };

      const stringSender = stringConnector.connect(stringReceiver);

      const objectSender: Sender<O> = {
        send: (message) => stringSender.send(JSON.stringify(message)),
        close: () => stringSender.close(),
        inspect: () => senderId,
      };

      console.debug(
        `connect(${connectorId}) OR=${objectReceiver.inspect()} OS=${senderId} SR=${stringReceiverId} SS=${stringSender.inspect()}`,
      );

      return objectSender;
    },
    inspect: () => connectorId,
  };

  return outerConnector;
};
