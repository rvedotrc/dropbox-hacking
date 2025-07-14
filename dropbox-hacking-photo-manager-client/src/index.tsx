import { defaultProvider as MultiplexerProvider } from "@hooks/useMultiplexer";
import { context as routingContext, type Router } from "@hooks/useRouter";
import { defaultProvider as ThumbnailProvider } from "@hooks/useThumbnail";
import logRender from "@lib/logRender";
import BasicCounts from "@pages/next-gen/basic-counts";
import ClosestTo from "@pages/next-gen/closest-to/index";
import NGContentHash from "@pages/next-gen/contentHash";
import NGDayFiles from "@pages/next-gen/day/files";
import ExifExplorer from "@pages/next-gen/exifExplorer";
import Fsck from "@pages/next-gen/fsck";
import NGDaysNoSamples from "@pages/next-gen/list-of-days/without-samples";
import Tags from "@pages/next-gen/tags";
import {
  type IOHandler,
  RouteState,
} from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
// RVE-add-route

const ensureNever = <_ extends never>() => undefined;

const toRender = ({ routeState }: { routeState: RouteState }) => {
  if (routeState.route === "closest-to") return <ClosestTo {...routeState} />;
  if (routeState.route === "route/next-gen/basic-counts")
    return <BasicCounts {...routeState} />;
  if (routeState.route === "route/next-gen/fsck")
    return <Fsck {...routeState} />;
  if (routeState.route === "route/next-gen/tags")
    return <Tags {...routeState} />;
  if (routeState.route === "route/next-gen/exif-explorer")
    return <ExifExplorer {...routeState} />;
  if (routeState.route === "route/next-gen/list-of-days/without-samples")
    return <NGDaysNoSamples {...routeState} />;
  if (routeState.route === "route/next-gen/day/files")
    return <NGDayFiles {...routeState} />;
  if (routeState.route === "route/next-gen/content-hash")
    return <NGContentHash {...routeState} />;
  // RVE-add-route

  ensureNever<typeof routeState>();

  return <span>Routing error</span>;
};

const Root = ({
  initialRouteState,
}: {
  initialRouteState: RouteState;
}): React.ReactElement | null => {
  const [state, switchToPage] = useState(initialRouteState);

  const router: Router = useMemo(() => ({ switchToPage }), []);

  useEffect(() => {
    const listener = (event: PopStateEvent) => {
      console.log(`popstate switchToPage`, event.state);
      return switchToPage(event.state as RouteState);
    };
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  const accepter = useMemo(
    () => (accept: IOHandler<unknown, unknown>) => {
      const w = accept.connect({
        receive: (m) => {
          console.log(`The server connected to me and said:`, m);
          w.send(`Thank you for saying ${m as string}`);
        },
        close: () => {},
        inspect: () => ``,
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
        // <React.StrictMode>
        <WrappedRoot initialRouteState={routeState} />,
        // </React.StrictMode>,
      );
    }
  }
});
