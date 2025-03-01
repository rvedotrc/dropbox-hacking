import {
  fromBasicWebSocket,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";
import type { WebsocketRequestHandler } from "express-ws";

type WS = Parameters<WebsocketRequestHandler>[0];

export const fromExpressWebSocket = (
  webSocket: WS
): IOHandler<string, string> =>
  fromBasicWebSocket<WS["readyState"], string, string>(webSocket);
