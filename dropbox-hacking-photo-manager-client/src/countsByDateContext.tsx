import * as React from "react";
import {
  CountsByDate,
  CountsByDateResponse,
} from "dropbox-hacking-photo-manager-shared";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const context = createContext<CountsByDate | undefined>(undefined);

export const useCountsByDate = () => useContext(context);

const defaultProvider = (props: { children?: ReactNode | undefined }) => {
  const [value, setValue] = useState<CountsByDate>();

  useEffect(() => {
    if (value === undefined) {
      fetch("/api/counts_by_date")
        .then((r) => r.json() as Promise<CountsByDateResponse>)
        .then((data) => setValue(data.counts_by_date));
    }
  }, [value]);

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider,
};
