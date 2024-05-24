import * as React from "react";
import { CountsByDate } from "dropbox-hacking-photo-manager-shared";
import { createContext, PropsWithChildren, useContext } from "react";
import logRender from "../logRender";
import * as feeds from "./feeds";
import { isLeft } from "../fp";

const context = createContext<CountsByDate | undefined>(undefined);

export const useCountsByDate = () => useContext(context);

const defaultCountsByDateContextProvider = (
  props: PropsWithChildren<object>,
) => {
  const feed = feeds.useCountsByDate();

  if (!feed) return <div>Loading CBDC ...</div>;
  if (isLeft(feed)) return <div>Error CBDC :-(</div>;

  return (
    <context.Provider value={feed.right.counts_by_date}>
      {props.children}
    </context.Provider>
  );
};

export default {
  context,
  defaultProvider: logRender(defaultCountsByDateContextProvider),
};
