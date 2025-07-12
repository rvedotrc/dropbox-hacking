import useMultiplexer from "@hooks/useMultiplexer";
import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type { RxFeedRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useEffect, useMemo, useState } from "react";

export const useLatestValueFromServerFeed = <V>(
  request: RxFeedRequest,
): V | undefined => {
  const mx = useMultiplexer();

  const observer = useMemo(
    () => (mx ? getRxFeed<V, RxFeedRequest>(request, mx) : undefined),
    [mx, JSON.stringify(request)],
  );

  const [latestValue, setLatestValue] = useState<V>();

  useEffect(() => {
    if (observer) {
      const subscription = observer.subscribe(setLatestValue);
      return () => {
        subscription.unsubscribe();
        setLatestValue(undefined);
      };
    }
  }, [observer]);

  return latestValue;
};
