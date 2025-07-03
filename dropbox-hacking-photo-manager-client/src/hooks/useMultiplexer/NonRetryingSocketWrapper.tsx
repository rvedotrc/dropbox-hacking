import generateId from "@lib/generateId";
import {
  multiplexer,
  transportAsJson,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";
import React, {
  type PropsWithChildren,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Provider } from "./context";
import { fromBrowserWebSocket } from "./fromBrowserWebSocket";

type T = IOHandler<unknown, unknown>;

export const NonRetryingSocketWrapper = (
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
