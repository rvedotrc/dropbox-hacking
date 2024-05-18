import * as React from "react";
import { EventEmitter } from "events";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { DPMAnyEvent } from "dropbox-hacking-photo-manager-shared";

export type Listener = (event: DPMAnyEvent) => void;

export type EventsProvider = EventEmitter & {
  on: (eventName: "foo", listener: Listener) => void;
  off: (eventName: "foo", listener: Listener) => void;
};

const context = createContext<EventsProvider | undefined>(undefined);

export const useEvents = () => useContext(context);

const defaultProvider = (props: { children?: ReactNode | undefined }) => {
  const value = useMemo<EventsProvider>(() => new EventEmitter(), []);

  const eventSource = useMemo(() => new EventSource("/api/events"), []);

  const genericListener = useMemo(
    () => (e: Event) => {
      if (e.type === "message") {
        const dpmEvent: DPMAnyEvent = JSON.parse(
          (e as unknown as { data: string }).data,
        );
        value.emit(dpmEvent.event_name, dpmEvent);
      }
    },
    [],
  );

  useEffect(() => {
    console.log("Adding ES listeners");
    eventSource.addEventListener("error", genericListener);
    eventSource.addEventListener("message", genericListener);
    eventSource.addEventListener("open", genericListener);

    return () => {
      console.log("Removing ES listeners");
      eventSource.removeEventListener("error", genericListener);
      eventSource.removeEventListener("message", genericListener);
      eventSource.removeEventListener("open", genericListener);
    };
  }, []);

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider,
};
