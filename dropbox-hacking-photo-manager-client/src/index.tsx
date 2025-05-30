import * as React from "react";

import { Payload, type IOHandler } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import * as multiplexerContext from "./context/rx/multiplexerContext";

import routingContext from "./context/routingContext";
import * as rxRecordFeedContext from "./context/rx/rxRecordFeedContext";
import * as additionalFeeds from "./context/rx/additionalFeeds";
import { Router } from "./context/routingContext";
import * as thumbnailLoaderContext from "./context/thumbnails";
import * as websocket from "./context/websocket";
import Day from "./day";
import Calendar from "./days/calendar";
import ListOfDays from "./days/listOfDays";
import logRender from "./logRender";
import Photo from "./photo";
import ClosestTo from "./closest-to/index";
import Stats from "./stats";
import Month from "./month";
import Year from "./year";

const toRender = ({ payload }: { payload: Payload }) => {
  if (payload.route === "closest-to")
    return <ClosestTo gps={payload.gps} nClosest={payload.nClosest} />;
  if (payload.route === "calendar") return <Calendar />;
  if (payload.route === "days") return <ListOfDays withSamples={true} />;
  if (payload.route === "days-plain") return <ListOfDays withSamples={false} />;
  if (payload.route === "day") return <Day date={payload.date} />;
  if (payload.route === "month") return <Month month={payload.month} />;
  if (payload.route === "year") return <Year year={payload.year} />;
  if (payload.route === "photo") return <Photo rev={payload.rev} />;
  if (payload.route === "stats") return <Stats />;
  return <span>Routing error</span>;
};

const Root = ({
  initialState,
}: {
  initialState: Payload;
}): React.ReactElement | null => {
  const [state, switchToPage] = useState(initialState);

  const router: Router = useMemo(() => ({ switchToPage }), []);

  useEffect(() => {
    const listener = (event: PopStateEvent) =>
      switchToPage(event.state as Payload);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  const accepter = useMemo(
    () => (accept: IOHandler<unknown, unknown>) => {
      const w = accept({
        receive: (m) => {
          console.log(`The server connected to me and said:`, m);
          w.send(`Thank you for saying ${m as string}`);
        },
        close: () => {},
      });
    },
    [],
  );

  return (
    <routingContext.context.Provider value={router}>
      <multiplexerContext.defaultProvider accepter={accepter}>
        <rxRecordFeedContext.defaultProvider>
          <additionalFeeds.defaultProvider>
            <websocket.defaultProvider>
              <thumbnailLoaderContext.defaultProvider>
                {toRender({ payload: state })}
              </thumbnailLoaderContext.defaultProvider>
            </websocket.defaultProvider>
          </additionalFeeds.defaultProvider>
        </rxRecordFeedContext.defaultProvider>
      </multiplexerContext.defaultProvider>
    </routingContext.context.Provider>
  );
};

const WrappedRoot = logRender(Root);

declare const BUILD_VERSION: string;
declare const BUILD_TIME: string;
console.log({ BUILD_VERSION, BUILD_TIME });

document.addEventListener("DOMContentLoaded", () => {
  const ele = document.getElementById("payload-script");

  if (ele) {
    const payload = JSON.parse(
      ele.getAttribute("data-payload") || "null",
    ) as Payload;
    const container = document.getElementById("react_container");
    if (container) {
      window.history.replaceState(payload, "unused");
      createRoot(container).render(
        // StrictMode removed: kills the EventSource stuff, for now
        // <StrictMode>
        <WrappedRoot initialState={payload} />,
        // </StrictMode>,
      );
    }
  }
});
