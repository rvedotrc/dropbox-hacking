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
import { generateId } from "@/context/websocket/id";

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

  // const [socket, setSocket] = useState<WebSocket>();
  const [t, setT] = useState<T>();

  useEffect(() => {
    const id = generateId();
    console.log(
      "mxc NonRetryingSocketWrapper",
      id,
      instanceId,
      "create socket",
    );
    const s = new WebSocket("/api/ws2");
    // setSocket(s);

    const openListener = () => {
      console.log(
        "mxc NonRetryingSocketWrapper",
        id,
        instanceId,
        "open",
        s?.readyState,
      );
      const io = multiplexer(
        transportAsJson(fromBrowserWebSocket(s)),
        props.accepter,
      );
      console.log("Made io", io);
      setT(() => io);
    };

    const errorListener = (errorEvent: ErrorEvent) => {
      console.error(
        `mxc NonRetryingSocketWrapper`,
        id,
        instanceId,
        "error",
        errorEvent,
        s?.readyState,
      );
    };

    const closeListener = (closeEvent: CloseEvent) => {
      console.info(
        `mxc NonRetryingSocketWrapper`,
        id,
        instanceId,
        "close",
        closeEvent,
        s?.readyState,
      );
      setT(undefined);
      props.onDead();
    };

    s.addEventListener("open", openListener);
    s.addEventListener("error", errorListener);
    s.addEventListener("close", closeListener);

    return () => {
      console.log(
        "mxc NonRetryingSocketWrapper",
        id,
        instanceId,
        "cleanup",
        s?.readyState,
      );

      s.removeEventListener("open", openListener);
      s.removeEventListener("error", errorListener);
      s.removeEventListener("close", closeListener);

      s?.close();
    };
  }, []);

  console.log("mxc NonRetryingSocketWrapper", instanceId, "providing", t);

  return <Provider value={t}>{props.children}</Provider>;
};

const GivenFixedAccepter = (
  props: PropsWithChildren<{ accepter: (accept: T) => void }>,
): React.ReactElement | null => {
  const instanceId = useMemo(() => generateId(), []);

  const [sleepTimer, setSleepTimer] = useState<number>();
  console.log("mxc GivenFixedAccepter", instanceId, sleepTimer);

  const onDead = useMemo(
    () => () => {
      if (!sleepTimer) {
        console.log(`mxc GivenFixedAccepter ${instanceId} dead!`);
        setSleepTimer(
          setTimeout(() => {
            setSleepTimer(undefined);
          }, 1000) as unknown as number,
        );
      }
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
