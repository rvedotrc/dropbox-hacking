import type { SimpleRequest } from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context.js";
import { simpleRequestHandlerBuilder } from "./simpleRequestHandler.js";

const getMessageType = (payload: unknown): string | undefined =>
  payload !== null &&
  typeof payload === "object" &&
  "type" in payload &&
  typeof payload.type === "string"
    ? payload.type
    : undefined;

export const messageHandlerBuilder = (context: Context) => {
  const simpleRequestHandler = simpleRequestHandlerBuilder(context);

  return (message: unknown): Promise<unknown> => {
    const messageType = getMessageType(message);

    if (messageType === undefined) return Promise.resolve(undefined);

    if (messageType === "simpleRequest")
      return simpleRequestHandler(message as SimpleRequest<unknown>);

    return Promise.resolve(undefined);
  };
};
