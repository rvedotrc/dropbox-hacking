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
import BasicCounts from "./next-gen/basic-counts";
import NGDaysNoSamples from "./next-gen/list-of-days/without-samples";
import NGDayFiles from "./next-gen/day/files";
import NGContentHash from "./next-gen/contentHash";
import NGFileId from "./next-gen/fileId";
import NGFileRev from "./next-gen/fileRev";
import Fsck from "./next-gen/fsck";

const ensureNever = <_ extends never>() => undefined;

const toRender = ({ payload }: { payload: Payload }) => {
  if (payload.route === "closest-to")
    return (
      <WithWholeDatabaseFeeds>
        <ClosestTo gps={payload.gps} nClosest={payload.nClosest} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "calendar")
    return (
      <WithWholeDatabaseFeeds>
        <Calendar />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "days")
    return (
      <WithWholeDatabaseFeeds>
        <ListOfDays withSamples={true} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "days-plain")
    return (
      <WithWholeDatabaseFeeds>
        <ListOfDays withSamples={false} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "day")
    return (
      <WithWholeDatabaseFeeds>
        <Day date={payload.date} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "month")
    return (
      <WithWholeDatabaseFeeds>
        <Month month={payload.month} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "year")
    return (
      <WithWholeDatabaseFeeds>
        <Year year={payload.year} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "photo")
    return (
      <WithWholeDatabaseFeeds>
        <Photo rev={payload.rev} />
      </WithWholeDatabaseFeeds>
    );
  if (payload.route === "stats")
    return (
      <WithWholeDatabaseFeeds>
        <Stats />
      </WithWholeDatabaseFeeds>
    );

  if (payload.route === "route/next-gen/basic-counts") return <BasicCounts />;
  if (payload.route === "route/next-gen/fsck") return <Fsck />;
  if (payload.route === "route/next-gen/list-of-days/without-samples")
    return <NGDaysNoSamples />;
  if (payload.route === "route/next-gen/day/files")
    return <NGDayFiles date={payload.date} />;
  if (payload.route === "route/next-gen/content-hash")
    return <NGContentHash contentHash={payload.contentHash} />;
  if (payload.route === "route/next-gen/file/id")
    return <NGFileId id={payload.id} />;
  if (payload.route === "route/next-gen/file/rev")
    return <NGFileRev rev={payload.rev} />;

  ensureNever<typeof payload>();

  return <span>Routing error</span>;
};

// const WithoutFeeds = ({ payload }: { payload: Payload }) => {};

const WithWholeDatabaseFeeds = (props: React.PropsWithChildren) => (
  <rxRecordFeedContext.defaultProvider>
    <additionalFeeds.defaultProvider>
      {props.children}
    </additionalFeeds.defaultProvider>
  </rxRecordFeedContext.defaultProvider>
);

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
        <websocket.defaultProvider>
          <thumbnailLoaderContext.defaultProvider>
            {toRender({ payload: state })}
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
    const payload = JSON.parse(
      ele.getAttribute("data-payload") || "null",
    ) as Payload;
    const container = document.getElementById("react_container");
    if (container) {
      window.history.replaceState(payload, "unused");
      createRoot(container).render(
        // StrictMode removed: kills the EventSource stuff, for now
        <React.StrictMode>
          <WrappedRoot initialState={payload} />
        </React.StrictMode>,
      );
    }
  }
});
