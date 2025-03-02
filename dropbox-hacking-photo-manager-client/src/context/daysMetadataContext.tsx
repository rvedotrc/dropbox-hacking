import { DayMetadata } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import logRender from "../logRender";
import { useRxFeedsViaMultiplexer } from "./rx/rxRecordFeedContext";
import { map } from "rxjs";
import { useLatestValue } from "./rx/useLatestValue";

const context = createContext<DayMetadata[] | undefined>(undefined);

export const useDays = (): DayMetadata[] | undefined => useContext(context);

const defaultDaysContextProvider = (props: PropsWithChildren<object>) => {
  const mx = useRxFeedsViaMultiplexer();
  const obs = useMemo(
    () => mx?.days?.pipe(map((t) => Object.values(t.image))),
    [mx],
  );
  const value = useLatestValue(obs);

  if (!value) return <div>Loading DMC ...</div>;

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider: logRender(defaultDaysContextProvider),
};
