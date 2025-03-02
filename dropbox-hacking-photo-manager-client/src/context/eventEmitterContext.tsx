import {
  DPMAnyEvent,
  DPMChangeEvent,
  DPMConnectEvent,
  DPMPingEvent,
} from "dropbox-hacking-photo-manager-shared";
import { EventEmitter } from "events";
import * as React from "react";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";

import logRender from "../logRender";

class EventsProvider extends EventEmitter {
  emit(eventName: "connect", event: DPMConnectEvent): boolean;
  emit(eventName: "ping", event: DPMPingEvent): boolean;
  emit(eventName: "change", event: DPMChangeEvent): boolean;
  emit(eventName: string | symbol, ...args: never[]): boolean {
    return super.emit(eventName, ...args);
  }

  on(eventName: "connect", listener: (event: DPMConnectEvent) => void): this;
  on(eventName: "ping", listener: (event: DPMPingEvent) => void): this;
  on(eventName: "change", listener: (event: DPMChangeEvent) => void): this;
  on(eventName: string | symbol, listener: (...args: never[]) => void): this {
    return super.on(eventName, listener);
  }

  off(eventName: "connect", listener: (event: DPMConnectEvent) => void): this;
  off(eventName: "ping", listener: (event: DPMPingEvent) => void): this;
  off(eventName: "change", listener: (event: DPMChangeEvent) => void): this;
  off(eventName: string | symbol, listener: (...args: never[]) => void): this {
    return super.off(eventName, listener);
  }

  once(eventName: "connect", listener: (event: DPMConnectEvent) => void): this;
  once(eventName: "ping", listener: (event: DPMPingEvent) => void): this;
  once(eventName: "change", listener: (event: DPMChangeEvent) => void): this;
  once(eventName: string | symbol, listener: (...args: never[]) => void): this {
    return super.once(eventName, listener);
  }

  addListener(
    eventName: "connect",
    listener: (event: DPMConnectEvent) => void,
  ): this;
  addListener(eventName: "ping", listener: (event: DPMPingEvent) => void): this;
  addListener(
    eventName: "change",
    listener: (event: DPMChangeEvent) => void,
  ): this;
  addListener(
    eventName: string | symbol,
    listener: (...args: never[]) => void,
  ): this {
    return super.addListener(eventName, listener);
  }

  removeListener(
    eventName: "connect",
    listener: (event: DPMConnectEvent) => void,
  ): this;
  removeListener(
    eventName: "ping",
    listener: (event: DPMPingEvent) => void,
  ): this;
  removeListener(
    eventName: "change",
    listener: (event: DPMChangeEvent) => void,
  ): this;
  removeListener(
    eventName: string | symbol,
    listener: (...args: never[]) => void,
  ): this {
    return super.removeListener(eventName, listener);
  }
}

const context = createContext<EventsProvider | undefined>(undefined);

export const useEvents = (): EventsProvider | undefined => useContext(context);

const defaultEventEmitterContextProvider = (
  props: PropsWithChildren<object>,
) => {
  const emitter = useMemo<EventsProvider>(() => new EventEmitter(), []);

  const eventSource = useMemo(() => {
    return new EventSource("/api/events");
  }, []);

  const genericListener = useMemo(
    () => (e: Event) => {
      if (e.type === "message") {
        const dpmEvent = JSON.parse(
          (e as unknown as { data: string }).data,
        ) as DPMAnyEvent;

        if (dpmEvent.event_name !== "ping")
          if (dpmEvent.event_name === "connect")
            emitter.emit("connect", dpmEvent);
        if (dpmEvent.event_name === "ping") emitter.emit("ping", dpmEvent);
        if (dpmEvent.event_name === "change") emitter.emit("change", dpmEvent);
      }
    },
    [emitter],
  );

  // The whole "beforeunload" logic is to avoid the error in the console
  // about the connection being interrupted when the page reloads.
  const beforeUnloadListener = useMemo(
    () => () => {
      console.debug(`EventSource close (beforeUnload)`);
      eventSource.close();
    },
    [eventSource],
  );

  useEffect(() => {
    eventSource.addEventListener("error", genericListener);
    eventSource.addEventListener("message", genericListener);
    eventSource.addEventListener("open", genericListener);
    window.addEventListener("beforeunload", beforeUnloadListener);

    return () => {
      eventSource.removeEventListener("error", genericListener);
      eventSource.removeEventListener("message", genericListener);
      eventSource.removeEventListener("open", genericListener);
      window.removeEventListener("beforeunload", beforeUnloadListener);
    };
  }, [eventSource, genericListener, beforeUnloadListener]);

  useEffect(
    () => () => {
      eventSource.close();
    },
    [eventSource],
  );

  return <context.Provider value={emitter}>{props.children}</context.Provider>;
};

export default {
  context,
  defaultProvider: logRender(defaultEventEmitterContextProvider),
};
