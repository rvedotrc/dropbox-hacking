import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { BasicCountsType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";

const Play = () => {
  const latestValue = useLatestValueFromServerFeed<BasicCountsType>({
    type: "ng.basic-counts",
  });

  return (
    <>
      <Navigate />

      <h1>Let's Play! Yay!</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
    </>
  );
};

export default logRender(Play);
