import * as React from "react";
import {
  CountsByDate,
  CountsByDateResponse,
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

  const connectListener = useMemo(
    () => (event: DPMConnectEvent) => {
      console.log("CBDC got event", event);
      setValue(undefined);
    },
    [],
  );

  const changeListener = useMemo(
    () => (event: DPMChangeEvent) => {
      console.log("CBDC got event", event);
      if (event.event_resource === "exif") makeRequest();
    },
    [makeRequest],
  );

  const events = useEvents();
  if (events === undefined) return null;

  useEffect(() => {
    console.log("CBDC listening for events");
    events.on("connect", connectListener);
    events.on("change", changeListener);
    return () => {
      console.log("CBDC stop listening for events");
      events.off("connect", connectListener);
      events.off("change", changeListener);
    };
  }, [events, connectListener, changeListener]);

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
