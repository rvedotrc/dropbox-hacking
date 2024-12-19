import type {
  PingRequest,
  PingResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context";

export const pingHandler =
  (_context: Context) =>
  (_req: PingRequest): Promise<PingResponse> =>
    Promise.resolve({ answer: "pong" });
