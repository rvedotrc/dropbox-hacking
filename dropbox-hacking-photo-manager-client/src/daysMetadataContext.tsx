import * as React from "react";
import {
  DayMetadata,
  DaysMetadataResponse,
} from "dropbox-hacking-photo-manager-shared";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const context = createContext<DayMetadata[] | undefined>(undefined);

export const useDaysMetadata = () => useContext(context);

const defaultProvider = (props: { children?: ReactNode | undefined }) => {
  const [value, setValue] = useState<DayMetadata[]>();

  useEffect(() => {
    if (value === undefined) {
      fetch("/api/day/all")
        .then((r) => r.json() as Promise<DaysMetadataResponse>)
        .then((data) => setValue(data.days_metadata));
    }
  }, [value]);

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider,
};
