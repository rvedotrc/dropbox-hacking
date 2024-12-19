import * as React from "react";

import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ThumbnailLoader } from "./types";
import { nullLoader } from "./nullThumbnailLoader";
import { discardingThumbnailLoader } from "./discardingThumbnailLoader";
import { websocketThumbnailLoader } from "./websocketThumbnailLoader";
import { useWebsocket } from "../websocket";

export const context = createContext<ThumbnailLoader>(nullLoader);
export const useThumbnailLoader = () => useContext(context);

export const defaultProvider = (props: PropsWithChildren<unknown>) => {
  const socket = useWebsocket();
  const loader = useMemo(
    () =>
      socket
        ? discardingThumbnailLoader(websocketThumbnailLoader(socket), 30_000)
        : nullLoader,
    [socket],
  );

  return <context.Provider value={loader}>{props.children}</context.Provider>;
};
