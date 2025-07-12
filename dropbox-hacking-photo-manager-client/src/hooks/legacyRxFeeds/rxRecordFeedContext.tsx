import useMultiplexer from "@hooks/useMultiplexer";
import { buildFromIO } from "@lib/legacyRxFeeds/rxFeedClient";
import React from "react";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type FEEDS = ReturnType<typeof buildFromIO>["feeds"];

const context = createContext<FEEDS | undefined>(undefined);
const Provider = context.Provider;

export const useRxFeedsViaMultiplexer = (): FEEDS | undefined =>
  useContext(context);

export const defaultProvider = (
  props: PropsWithChildren<unknown>,
): React.ReactElement | null => {
  const mx = useMultiplexer();
  const [feeds, setFeeds] = useState<FEEDS>();

  useEffect(() => {
    if (!mx) {
      setFeeds(undefined);
    } else if (!feeds) {
      const result = buildFromIO(mx);
      setFeeds(result.feeds);
      // FIXME: work out when to call result.closer()
    }
  }, [mx, feeds]);

  return <Provider value={feeds}>{props.children}</Provider>;
};
