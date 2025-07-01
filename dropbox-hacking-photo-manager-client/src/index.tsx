import * as React from "react";

import {
  RouteState,
  type IOHandler,
} from "dropbox-hacking-photo-manager-shared";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { context as routingContext, type Router } from "@hooks/useRouter";
import * as rxRecordFeedContext from "./hooks/legacyRxFeeds/rxRecordFeedContext";
import * as additionalFeeds from "./hooks/legacyRxFeeds/additionalFeeds";
import { defaultProvider as MultiplexerProvider } from "@hooks/useMultiplexer";
import { defaultProvider as ThumbnailProvider } from "@hooks/useThumbnail";
import Day from "@pages/legacy/day";
import Calendar from "@pages/legacy/days/calendar";
import ListOfDays from "@pages/legacy/days/listOfDays";
import logRender from "@lib/logRender";
import Photo from "@pages/legacy/photo";
import ClosestTo from "@pages/legacy/closest-to/index";
import Month from "@pages/legacy/month";
import Year from "@pages/legacy/year";
import BasicCounts from "@pages/next-gen/basic-counts";
import NGDaysNoSamples from "@pages/next-gen/list-of-days/without-samples";
import NGDayFiles from "@pages/next-gen/day/files";
import NGContentHash from "@pages/next-gen/contentHash";
import Fsck from "@pages/next-gen/fsck";
import ExifExplorer from "@pages/next-gen/exifExplorer";

const ensureNever = <_ extends never>() => undefined;

const toRender = ({ routeState }: { routeState: RouteState }) => {
  if (routeState.route === "closest-to")
    return <ClosestTo gps={routeState.gps} nClosest={routeState.nClosest} />;
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
  // RVE-add-route

  ensureNever<typeof routeState>();

  return <span>Routing error</span>;
};

const WithWholeDatabaseFeeds = (props: React.PropsWithChildren) => (
  <rxRecordFeedContext.defaultProvider>
    <additionalFeeds.defaultProvider>
      <h1>USING WHOLE DB FEED</h1>
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
    <routingContext.Provider value={router}>
      <MultiplexerProvider accepter={accepter}>
        <ThumbnailProvider>{toRender({ routeState: state })}</ThumbnailProvider>
      </MultiplexerProvider>
    </routingContext.Provider>
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
        <React.StrictMode>
          <WrappedRoot initialRouteState={routeState} />
        </React.StrictMode>,
      );
    }
  }
});
