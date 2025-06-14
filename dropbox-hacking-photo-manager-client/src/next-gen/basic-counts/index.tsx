import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { BasicCountsType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";

const BasicCounts = () => {
  const latestValue = useLatestValueFromServerFeed<BasicCountsType>({
    type: "rx.ng.basic-counts",
  });

  return (
    <>
      <Navigate />

      <h1>Basic Counts</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
    </>
  );
};

export default logRender(BasicCounts);
