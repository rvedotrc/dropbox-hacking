import React, { useEffect } from "react";

import logRender from "@lib/logRender";
import Navigate from "@components/navigate";
import type { BasicCountsType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";

const BasicCounts = () => {
  const latestValue = useLatestValueFromServerFeed<BasicCountsType>({
    type: "rx.ng.basic-counts",
  });

  useEffect(() => {
    document.title = "DPMNG - Basic counts";
  }, []);

  return (
    <>
      <Navigate />

      <h1>Basic Counts</h1>

      {latestValue ? (
        <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(BasicCounts);
