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
  useMemo,
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
  const [connect, setConnect] = useState<[T]>();

  const newSocket = useMemo(
    () => () => {
      const newWebSocket = new WebSocket("/api/ws2");
      setWebSocket(newWebSocket);

      newWebSocket.addEventListener("open", () => {
        const newConnect = multiplexer(
          transportAsJson(fromBrowserWebSocket(newWebSocket)),
          props.accepter,
        );
        setConnect([newConnect]);
      });

      newWebSocket.addEventListener("close", () => {
        setTimeout(() => {
          setConnect(undefined);
          newSocket();
        }, 500);
      });
    },
    [],
  );

  useEffect(() => {
    if (!webSocket) newSocket();
  }, []);

  useEffect(() => () => webSocket?.close(), [webSocket]);

  return <Provider value={connect?.[0]}>{props.children}</Provider>;
};
