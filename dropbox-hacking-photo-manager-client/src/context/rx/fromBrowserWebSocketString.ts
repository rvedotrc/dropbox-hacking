import {
  fromBasicWebSocket,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";

export const fromBrowserWebSocket = (
  webSocket: WebSocket,
): IOHandler<string, string> =>
  fromBasicWebSocket<WebSocket["readyState"], string, string>(webSocket);
