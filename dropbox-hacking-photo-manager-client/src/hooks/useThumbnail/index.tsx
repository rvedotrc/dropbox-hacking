import useMultiplexer from "@hooks/useMultiplexer";
import * as React from "react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import { discardingThumbnailLoader } from "./discardingThumbnailLoader";
import { nullLoader } from "./nullThumbnailLoader";
import type { ThumbnailLoader } from "./types";
import { useThumbnail } from "./useThumbnail";
import { websocketThumbnailLoader } from "./websocketThumbnailLoader";

export const context = createContext<ThumbnailLoader>(nullLoader);
export const useThumbnailLoader = (): ThumbnailLoader => useContext(context);

export const defaultProvider = (
  props: PropsWithChildren<unknown>,
): React.ReactElement | null => {
  const mx = useMultiplexer();
  const loader = useMemo(
    () =>
      mx
        ? discardingThumbnailLoader(websocketThumbnailLoader(mx), 30_000)
        : nullLoader,
    [mx],
  );

  return <context.Provider value={loader}>{props.children}</context.Provider>;
};

export default useThumbnail;
