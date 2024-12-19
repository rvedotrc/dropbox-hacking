import type {
  SimpleRequest,
  SimpleResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context";
import { pingHandler } from "./pingHandler";
import { thumbnailHandler } from "./thumbnailHandler";

export type SimpleRequestHandler<I, O> = (request: I) => Promise<O>;
type H<I, O> = (
  req: SimpleRequest<I>,
) => Promise<SimpleResponse<O> | undefined>;

// const parse = (text: string) => {
//   try {
//     return { ok: true, value: JSON.parse(text) };
//   } catch {
//     return { ok: false };
//   }
// };

const getVerb = (payload: unknown): string | undefined =>
  payload !== null &&
  typeof payload === "object" &&
  "verb" in payload &&
  typeof payload.verb === "string"
    ? payload.verb
    : undefined;

const countPending = (inner: H<unknown, unknown>): H<unknown, unknown> => {
  const pending: Record<string, { t0: number }> = {};

  return (req) => {
    pending[req.id] = { t0: new Date().getTime() };
    console.debug(`#${req.id} - (${Object.keys(pending).length} pending)`);

    return inner(req).finally(() => {
      const p = pending[req.id];
      delete pending[req.id];
      const t1 = new Date().getTime();

      console.debug(
        `#${req.id} ${t1 - p.t0}ms (${Object.keys(pending).length} pending)`,
      );
    });
  };
};

export const simpleRequestHandler = (context: Context): H<unknown, unknown> => {
  const handlerMap = {
    getThumbnail: thumbnailHandler(context),
    ping: pingHandler(context),
  } as const;

  const h = (
    req: SimpleRequest<unknown>,
  ): Promise<SimpleResponse<unknown> | undefined> => {
    const verb = getVerb(req.payload);

    if (verb === undefined) return Promise.resolve(undefined);

    const handler: SimpleRequestHandler<unknown, unknown> | undefined =
      handlerMap[verb];

    if (!handler) return Promise.resolve(undefined);

    return handler(req.payload).then((payload) => ({
      type: "simpleResponse",
      id: req.id,
      payload,
    }));
  };

  return countPending(h);
};
