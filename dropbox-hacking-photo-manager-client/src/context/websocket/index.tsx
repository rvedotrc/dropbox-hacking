import * as React from "react";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { Socket } from "./socket";

export const context = createContext<Socket | undefined>(undefined);
const Provider = context.Provider;

export const useWebsocket = (): Socket | undefined => useContext(context);

export const defaultProvider = (
  props: PropsWithChildren<unknown>,
): React.ReactElement | null => {
  const w = useMemo(() => new Socket("/api/ws"), []);

  useEffect(() => {
    w.wantOpen = true;
    return () => {
      w.wantOpen = false;
    };
  }, []);

  return <Provider value={w}>{props.children}</Provider>;
};
