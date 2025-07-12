import generateId from "@lib/generateId";
import * as React from "react";
import { PropsWithChildren, useContext, useMemo } from "react";

import { context, type T } from "./context";
import { GivenFixedAccepter } from "./GivenFixedAccepter";

const useMultiplexer = (): T | undefined => useContext(context);
export default useMultiplexer;

export const defaultProvider = (
  props: PropsWithChildren<{ accepter: (accept: T) => void }>,
): React.ReactElement | null => {
  const instanceId = useMemo(() => generateId(), []);
  const key = useMemo(() => generateId(), [props.accepter]);
  console.log("mxc defaultProvider", instanceId, key);

  return <GivenFixedAccepter key={key} {...props} />;
};
