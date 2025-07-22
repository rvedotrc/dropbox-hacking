import useMultiplexer from "@hooks/useMultiplexer";
import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type {
  IOHandler,
  ObservableUpdate,
} from "dropbox-hacking-photo-manager-shared";
import type {
  FeedMap,
  RequestTypeFor,
  ResponseTypeFor,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useEffect, useMemo, useState } from "react";

export const useLatestValueFromServerFeed = <
  REQ extends RequestTypeFor<keyof FeedMap>,
  NAME extends REQ["type"],
  RES extends ResponseTypeFor<NAME>,
>(
  request: REQ,
) => {
  const mx = useMultiplexer() as IOHandler<ObservableUpdate<RES>, REQ>;

  const observer = useMemo(
    () => (mx ? getRxFeed(request, mx) : undefined),
    [mx, JSON.stringify(request)],
  );

  const [latestValue, setLatestValue] = useState<RES>();

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
