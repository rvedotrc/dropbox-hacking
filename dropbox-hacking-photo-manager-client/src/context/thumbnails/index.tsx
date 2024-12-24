import * as React from "react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import { useWebsocket } from "../websocket";
import { discardingThumbnailLoader } from "./discardingThumbnailLoader";
import { nullLoader } from "./nullThumbnailLoader";
import type { ThumbnailLoader } from "./types";
import { websocketThumbnailLoader } from "./websocketThumbnailLoader";

export const context = createContext<ThumbnailLoader>(nullLoader);
export const useThumbnailLoader = (): ThumbnailLoader => useContext(context);

export const defaultProvider = (
  props: PropsWithChildren<unknown>,
): React.ReactElement | null => {
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
