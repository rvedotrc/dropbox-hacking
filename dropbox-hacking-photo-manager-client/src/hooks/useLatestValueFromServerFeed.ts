import useMultiplexer from "@hooks/useMultiplexer";
import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type {
  FeedMap,
  RequestTypeFor,
  ResponseTypeFor,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useEffect, useMemo, useState } from "react";

export const useLatestValueFromServerFeed = <
  REQ extends RequestTypeFor<keyof FeedMap>,
>(
  request: REQ,
) => {
  const mx = useMultiplexer();

  const observer = useMemo(
    () =>
      mx
        ? getRxFeed<ResponseTypeFor<REQ["type"]>, REQ>(request, mx)
        : undefined,
    [mx, JSON.stringify(request)],
  );

  const [latestValue, setLatestValue] =
    useState<ResponseTypeFor<REQ["type"]>>();

  useEffect(() => {
    if (observer) {
      const subscription = observer.subscribe(setLatestValue);
      return () => {
        console.log(`ULVFSF effect-close`);
        subscription.unsubscribe();
        setLatestValue(undefined);
      };
    }
  }, [observer]);

  return latestValue;
};
