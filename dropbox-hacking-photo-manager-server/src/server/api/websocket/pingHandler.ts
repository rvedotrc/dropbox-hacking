import type {
  PingRequest,
  PingResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context.js";

export const pingHandlerBuilder =
  (_context: Context) =>
  (_req: PingRequest): Promise<PingResponse> =>
    Promise.resolve({ answer: "pong" });
