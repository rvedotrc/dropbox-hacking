import * as React from "react";

import {
  IOHandler,
  multiplexer,
  transportAsJson,
} from "dropbox-hacking-photo-manager-shared";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { fromBrowserWebSocket } from "./fromBrowserWebSocketString";

type T = IOHandler<unknown, unknown>;

export const context = createContext<T | undefined>(undefined);
const Provider = context.Provider;

export const useMultiplexer = (): T | undefined => useContext(context);

export const defaultProvider = (
  props: PropsWithChildren<{ accepter: (accept: T) => void }>,
): React.ReactElement | null => {
  const [webSocket, setWebSocket] = useState<WebSocket>();
  const [connect, setConnect] = useState<T>();

  useEffect(() => {
    if (!webSocket) {
      const newWebSocket = new WebSocket("/api/ws2");
      setWebSocket(newWebSocket);
      return () => newWebSocket.close();
    }
  }, []);

  useEffect(() => {
    if (webSocket) {
      webSocket.addEventListener("open", () => {
        const newConnect = multiplexer(
          transportAsJson(fromBrowserWebSocket(webSocket)),
          props.accepter,
        );
        setConnect(() => newConnect);
      });
    }
  }, [webSocket]);

  return <Provider value={connect}>{props.children}</Provider>;
};
