import * as React from "react";
import {
  DayMetadata,
  DaysMetadataResponse,
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

const context = createContext<DayMetadata[] | undefined>(undefined);

export const useDaysMetadata = () => useContext(context);

const defaultProvider = (props: { children?: ReactNode | undefined }) => {
  const [requesting, setRequesting] = useState(false);
  const [value, setValue] = useState<DayMetadata[]>();

  const makeRequest = useMemo(
    () => () => {
      console.log("requesting days metadata");
      if (requesting) console.warn("Overlapping requests in DMC");

      fetch("/api/day/all")
        .then((r) => r.json() as Promise<DaysMetadataResponse>)
        .then((data) => {
          setValue(data.days_metadata);
          setRequesting(false);
        });
      setRequesting(true);
    },
    [],
  );

  const listener = useMemo(
    () => (event: DPMAnyEvent) => {
      if (event.event_name === "connect") {
        setValue(undefined);
      } else if (
        event.event_name === "change" &&
        event.event_resource === "days"
      ) {
        makeRequest();
      }
    },
    [makeRequest],
  );

  const events = useEvents();
  if (events === undefined) return null;

  useEffect(() => {
    console.log("DMC listening for events");
    events.on("connect", listener);
    events.on("change", listener);
    return () => {
      console.log("DMC stop listening for events");
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
