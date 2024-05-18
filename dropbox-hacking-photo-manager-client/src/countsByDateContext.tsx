import * as React from "react";
import {
  CountsByDate,
  CountsByDateResponse,
  DPMAnyEvent,
} from "dropbox-hacking-photo-manager-shared";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useEvents } from "./eventEmitterContext";

const context = createContext<CountsByDate | undefined>(undefined);

export const useCountsByDate = () => useContext(context);

const defaultProvider = (props: { children?: ReactNode | undefined }) => {
  const [requesting, setRequesting] = useState(false);
  const [value, setValue] = useState<CountsByDate>();

  const makeRequest = useMemo(
    () => () => {
      console.log("requesting counts by date");
      if (requesting) console.warn("Overlapping requests in CBDC");

      fetch("/api/counts_by_date")
        .then((r) => r.json() as Promise<CountsByDateResponse>)
        .then((data) => {
          setValue(data.counts_by_date);
          setRequesting(false);
        });
      setRequesting(true);
    },
    [],
  );

  const listener = useMemo(
    () => (event: DPMAnyEvent) => {
      console.log("CBDC got event", event);

      if (event.event_name === "connect") {
        setValue(undefined);
      } else if (
        event.event_name === "change" &&
        event.event_resource === "exif"
      ) {
        makeRequest();
      }
    },
    [makeRequest],
  );

  const events = useEvents();
  if (events === undefined) return null;

  useEffect(() => {
    console.log("CBDC listening for events");
    events.on("connect", listener);
    events.on("change", listener);
    return () => {
      console.log("CBDC stop listening for events");
      events.off("connect", listener);
      events.off("change", listener);
    };
  }, [events, listener]);

  useEffect(() => {
    if (value === undefined && !requesting) {
      makeRequest();
    }
  });

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider,
};
