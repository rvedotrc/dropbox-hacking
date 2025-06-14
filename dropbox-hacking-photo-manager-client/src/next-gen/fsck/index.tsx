import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { FsckType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";

const Fsck = () => {
  const latestValue = useLatestValueFromServerFeed<FsckType>({
    type: "rx.ng.fsck",
  });

  return (
    <>
      <Navigate />

      <h1>fsck</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
    </>
  );
};

export default logRender(Fsck);
