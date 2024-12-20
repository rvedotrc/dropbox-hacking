import * as React from "react";
import { createRoot } from "react-dom/client";

import Calendar from "./days/calendar";
import Day from "./day";
import Photo from "./photo";
import ListOfDays from "./days/listOfDays";
import { Payload } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useMemo, useState } from "react";
import countsByDateContext from "./context/countsByDateContext";
import daysMetadataContext from "./context/daysMetadataContext";
import eventEmitterContext from "./context/eventEmitterContext";
import * as thumbnailLoaderContext from "./context/thumbnails";
import * as websocket from "./context/websocket";
import routingContext from "./context/routingContext";
import { Router } from "./context/routingContext";
import logRender from "./logRender";

const toRender = ({ payload }: { payload: Payload }) => {
  if (payload.route === "calendar") return <Calendar />;
  if (payload.route === "days") return <ListOfDays withSamples={true} />;
  if (payload.route === "days-plain") return <ListOfDays withSamples={false} />;
  if (payload.route === "day") return <Day date={payload.date} />;
  if (payload.route === "photo") return <Photo rev={payload.rev} />;
  return <span>Routing error</span>;
};

const Root = ({ initialState }: { initialState: Payload }) => {
  const [state, switchToPage] = useState(initialState);

  const router: Router = useMemo(() => ({ switchToPage }), []);

  useEffect(() => {
    const listener = (event: PopStateEvent) => switchToPage(event.state);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  return (
    <routingContext.context.Provider value={router}>
      <websocket.defaultProvider>
        <eventEmitterContext.defaultProvider>
          <countsByDateContext.defaultProvider>
            <daysMetadataContext.defaultProvider>
              <thumbnailLoaderContext.defaultProvider>
                {toRender({ payload: state })}
              </thumbnailLoaderContext.defaultProvider>
            </daysMetadataContext.defaultProvider>
          </countsByDateContext.defaultProvider>
        </eventEmitterContext.defaultProvider>
      </websocket.defaultProvider>
    </routingContext.context.Provider>
  );
};

const WrappedRoot = logRender(Root);

document.addEventListener("DOMContentLoaded", () => {
  const ele = document.getElementById("payload-script");

  if (ele) {
    const payload = JSON.parse(ele.getAttribute("data-payload") || "null");
    const container = document.getElementById("react_container");
    if (container) {
      window.history.replaceState(payload, "unused");
      createRoot(container!).render(
        // StrictMode removed: kills the EventSource stuff, for now
        // <StrictMode>
        <WrappedRoot initialState={payload} />,
        // </StrictMode>,
      );
    }
  }
});
