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
import { generateId } from "../../context/websocket/id";

type T = IOHandler<unknown, unknown>;

export const context = createContext<T | undefined>(undefined);
const Provider = context.Provider;

export const useMultiplexer = (): T | undefined => useContext(context);

const NonRetryingSocketWrapper = (
  props: PropsWithChildren<{
    accepter: (accept: T) => void;
    onDead: () => void;
  }>,
) => {
  const instanceId = useMemo(() => generateId(), []);
  console.log("mxc NonRetryingSocketWrapper", instanceId);

  const [socket, setSocket] = useState<WebSocket>();
  const [t, setT] = useState<T>();

  useEffect(() => {
    console.log("mxc NonRetryingSocketWrapper", instanceId, "create socket");
    const s = new WebSocket("/api/ws2");
    setSocket(s);

    s.addEventListener("open", () => {
      console.log("mxc NonRetryingSocketWrapper", instanceId, "open");
      const io = multiplexer(
        transportAsJson(fromBrowserWebSocket(s)),
        props.accepter,
      );
      console.log("Made io", io);
      setT(() => io);
    });

    s.addEventListener("error", (errorEvent) => {
      console.error(`SocketWrapper ${instanceId} error`, errorEvent);
    });

    s.addEventListener("close", (closeEvent) => {
      console.info(`SocketWrapper ${instanceId} close`, closeEvent);
      setT(undefined);
      props.onDead();
    });

    return () => {
      console.log("mxc NonRetryingSocketWrapper", instanceId, "cleanup");
      socket?.close();
    };
  }, []);

  console.log("providing", t);

  return <Provider value={t}>{props.children}</Provider>;
};

const GivenFixedAccepter = (
  props: PropsWithChildren<{ accepter: (accept: T) => void }>,
): React.ReactElement | null => {
  const instanceId = useMemo(() => generateId(), []);
  console.log("mxc GivenFixedAccepter", instanceId);

  const [sleepTimer, setSleepTimer] = useState<number>();

  const onDead = useMemo(
    () => () => {
      console.log(`mxc GivenFixedAccepter ${instanceId} dead!`);
      setSleepTimer(
        setTimeout(() => {
          setSleepTimer(undefined);
        }, 1000) as unknown as number,
      );
    },
    [],
  );

  return sleepTimer ? (
    <Provider value={undefined}>{props.children}</Provider>
  ) : (
    <NonRetryingSocketWrapper accepter={props.accepter} onDead={onDead}>
      {props.children}
    </NonRetryingSocketWrapper>
  );
};

export const defaultProvider = (
  props: PropsWithChildren<{ accepter: (accept: T) => void }>,
): React.ReactElement | null => {
  const instanceId = useMemo(() => generateId(), []);
  const key = useMemo(() => generateId(), [props.accepter]);
  console.log("mxc defaultProvider", instanceId, key);

  return <GivenFixedAccepter key={key} {...props} />;
};
