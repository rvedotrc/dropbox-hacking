import * as React from "react";
import {
  DayMetadata,
  DaysMetadataResponse,
  DPMChangeEvent,
  DPMConnectEvent,
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

  const connectListener = useMemo(
    () => (event: DPMConnectEvent) => {
      console.log("DMC got event", event);
      setValue(undefined);
    },
    [],
  );

  const changeListener = useMemo(
    () => (event: DPMChangeEvent) => {
      console.log("DMC got event", event);
      if (event.event_resource === "days") makeRequest();
    },
    [makeRequest],
  );

  const events = useEvents();
  if (events === undefined) return null;

  useEffect(() => {
    console.log("DMC listening for events");
    events.on("connect", connectListener);
    events.on("change", changeListener);
    return () => {
      console.log("DMC stop listening for events");
      events.off("connect", connectListener);
      events.off("change", changeListener);
    };
  }, [events, connectListener, changeListener]);

  useEffect(() => {
    if (value === undefined && !requesting) {
      makeRequest();
    }
  }, [value, requesting, makeRequest]);

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider,
};
