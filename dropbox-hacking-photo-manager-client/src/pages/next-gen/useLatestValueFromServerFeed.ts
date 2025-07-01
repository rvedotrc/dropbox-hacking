import { useEffect, useMemo, useState } from "react";
import { useMultiplexer } from "@/context/rx/multiplexerContext";
import { getRxFeed } from "@/context/rx/getRxFeed";
import type { RxFeedRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

export const useLatestValueFromServerFeed = <V>(
  request: RxFeedRequest,
): V | undefined => {
  const mx = useMultiplexer();

  const observer = useMemo(
    () => (mx ? getRxFeed<V, RxFeedRequest>(request, mx) : undefined),
    [mx],
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
