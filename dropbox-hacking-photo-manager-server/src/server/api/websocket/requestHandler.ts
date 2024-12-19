import type { SimpleRequest } from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context";
import { simpleRequestHandler } from "./simpleRequestHandler";

const getType = (payload: unknown): string | undefined =>
  payload !== null &&
  typeof payload === "object" &&
  "type" in payload &&
  typeof payload.type === "string"
    ? payload.type
    : undefined;

export const requestHandler = (context: Context) => {
  const handler = simpleRequestHandler(context);

  return (req: unknown): Promise<unknown> => {
    const type = getType(req);

    if (type === undefined) return Promise.resolve(undefined);

    if (type === "simpleRequest") return handler(req as SimpleRequest<unknown>);

    return Promise.resolve(undefined);
  };
};
