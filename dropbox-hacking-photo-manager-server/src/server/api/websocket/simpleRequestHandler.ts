import type {
  SimpleRequest,
  SimpleResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context.js";
import { pingHandlerBuilder } from "./pingHandler.js";
import { closestToHandlerBuilder } from "./closestToHandler.js";

// export type SimpleRequestHandler<I, O> = (request: I) => Promise<O>;
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

const getSimpleRequestPayloadVerb = (payload: unknown): string | undefined =>
  (
    payload !== null &&
    typeof payload === "object" &&
    "verb" in payload &&
    typeof payload.verb === "string"
  ) ?
    payload.verb
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

export const simpleRequestHandlerBuilder = (
  context: Context,
): H<unknown, unknown> => {
  const handlerMap = {
    ping: pingHandlerBuilder(context),
    closestTo: closestToHandlerBuilder(context),
  } as const;

  const simpleRequestHandler = async (
    simpleRequest: SimpleRequest<unknown>,
  ): Promise<SimpleResponse<unknown> | undefined> => {
    const verb = getSimpleRequestPayloadVerb(simpleRequest.payload);

    if (verb === undefined) return Promise.resolve(undefined);

    const handler = handlerMap[verb as keyof typeof handlerMap];
    if (!handler) return Promise.resolve(undefined);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload_1 = await handler(simpleRequest.payload as any);

    return {
      type: "simpleResponse",
      id: simpleRequest.id,
      payload: payload_1,
    };
  };

  return countPending(simpleRequestHandler);
};
