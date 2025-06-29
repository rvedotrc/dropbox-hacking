import * as React from "react";

import {
  RouteState,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";
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
import Month from "./month";
import Year from "./year";
import BasicCounts from "./next-gen/basic-counts";
import NGDaysNoSamples from "./next-gen/list-of-days/without-samples";
import NGDayFiles from "./next-gen/day/files";
import NGContentHash from "./next-gen/contentHash";
import NGFileId from "./next-gen/fileId";
import NGFileRev from "./next-gen/fileRev";
import Fsck from "./next-gen/fsck";
import ExifExplorer from "./next-gen/exifExplorer";

const ensureNever = <_ extends never>() => undefined;

const toRender = ({ routeState }: { routeState: RouteState }) => {
  if (routeState.route === "closest-to")
    return (
      <WithWholeDatabaseFeeds>
        <ClosestTo gps={routeState.gps} nClosest={routeState.nClosest} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "calendar")
    return (
      <WithWholeDatabaseFeeds>
        <Calendar />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "days")
    return (
      <WithWholeDatabaseFeeds>
        <ListOfDays withSamples={true} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "days-plain")
    return (
      <WithWholeDatabaseFeeds>
        <ListOfDays withSamples={false} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "day")
    return (
      <WithWholeDatabaseFeeds>
        <Day date={routeState.date} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "month")
    return (
      <WithWholeDatabaseFeeds>
        <Month month={routeState.month} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "year")
    return (
      <WithWholeDatabaseFeeds>
        <Year year={routeState.year} />
      </WithWholeDatabaseFeeds>
    );
  if (routeState.route === "photo")
    return (
      <WithWholeDatabaseFeeds>
        <Photo rev={routeState.rev} />
      </WithWholeDatabaseFeeds>
    );

  if (routeState.route === "route/next-gen/basic-counts")
    return <BasicCounts />;
  if (routeState.route === "route/next-gen/fsck") return <Fsck />;
  if (routeState.route === "route/next-gen/exif-explorer")
    return <ExifExplorer />;
  if (routeState.route === "route/next-gen/list-of-days/without-samples")
    return <NGDaysNoSamples />;
  if (routeState.route === "route/next-gen/day/files")
    return <NGDayFiles date={routeState.date} />;
  if (routeState.route === "route/next-gen/content-hash")
    return <NGContentHash contentHash={routeState.contentHash} />;
  if (routeState.route === "route/next-gen/file/id")
    return <NGFileId id={routeState.id} />;
  if (routeState.route === "route/next-gen/file/rev")
    return <NGFileRev rev={routeState.rev} />;
  // RVE-add-route

  ensureNever<typeof routeState>();

  return <span>Routing error</span>;
};

const WithWholeDatabaseFeeds = (props: React.PropsWithChildren) => (
  <rxRecordFeedContext.defaultProvider>
    <additionalFeeds.defaultProvider>
      {props.children}
    </additionalFeeds.defaultProvider>
  </rxRecordFeedContext.defaultProvider>
);

const Root = ({
  initialRouteState,
}: {
  initialRouteState: RouteState;
}): React.ReactElement | null => {
  const [state, switchToPage] = useState(initialRouteState);

  const router: Router = useMemo(() => ({ switchToPage }), []);

  useEffect(() => {
    const listener = (event: PopStateEvent) =>
      switchToPage(event.state as RouteState);
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
        <websocket.defaultProvider>
          <thumbnailLoaderContext.defaultProvider>
            {toRender({ routeState: state })}
          </thumbnailLoaderContext.defaultProvider>
        </websocket.defaultProvider>
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
    const routeState = JSON.parse(
      ele.getAttribute("data-routestate") || "null",
    ) as RouteState;
    const container = document.getElementById("react_container");
    if (container) {
      window.history.replaceState(routeState, "unused");
      createRoot(container).render(
        // StrictMode removed: kills the EventSource stuff, for now
        <React.StrictMode>
          <WrappedRoot initialRouteState={routeState} />
        </React.StrictMode>,
      );
    }
  }
});
