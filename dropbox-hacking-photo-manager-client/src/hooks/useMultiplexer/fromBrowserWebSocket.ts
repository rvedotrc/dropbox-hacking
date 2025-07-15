import {
  fromBasicWebSocket,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";

export const fromBrowserWebSocket = (
  webSocket: WebSocket,
  id: string,
): IOHandler<string, string> =>
  fromBasicWebSocket<WebSocket["readyState"], string, string>(webSocket, id);
