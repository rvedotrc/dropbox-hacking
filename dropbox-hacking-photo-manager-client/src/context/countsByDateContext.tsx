import * as React from "react";
import {
  CountsByDate,
  CountsByDateResponse,
  DPMChangeEvent,
} from "dropbox-hacking-photo-manager-shared";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useEvents } from "./eventEmitterContext";
import logRender from "../logRender";

const context = createContext<CountsByDate | undefined>(undefined);

export const useCountsByDate = () => useContext(context);

const defaultCountsByDateContextProvider = (
  props: PropsWithChildren<object>,
) => {
  const [requesting, setRequesting] = useState(false);
  const [value, setValue] = useState<CountsByDate>();

  const makeRequest = useMemo(
    () => () => {
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

  const connectListener = useMemo(() => () => setValue(undefined), []);

  const changeListener = useMemo(
    () => (event: DPMChangeEvent) => {
      if (event.event_resource === "exif") makeRequest();
    },
    [makeRequest],
  );

  const events = useEvents();
  if (events === undefined) return null;

  useEffect(() => {
    events.on("connect", connectListener);
    events.on("change", changeListener);

    return () => {
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
  defaultProvider: logRender(defaultCountsByDateContextProvider),
};
