import * as React from "react";
import { DayMetadata } from "dropbox-hacking-photo-manager-shared";
import { createContext, PropsWithChildren, useContext } from "react";
import logRender from "../logRender";
import * as feeds from "./feeds";
import { isLeft } from "../fp";

const context = createContext<DayMetadata[] | undefined>(undefined);

export const useDays = () => useContext(context);

const defaultDaysContextProvider = (props: PropsWithChildren<object>) => {
  const feed = feeds.useDays();

  if (!feed) return <div>Loading DMC ...</div>;
  if (isLeft(feed)) return <div>Error DMC :-(</div>;

  return (
    <context.Provider value={feed.right.days_metadata}>
      {props.children}
    </context.Provider>
  );
};

export default {
  context,
  defaultProvider: logRender(defaultDaysContextProvider),
};
