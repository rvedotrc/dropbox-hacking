import Navigate from "@components/navigate";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import type { FsckType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { useEffect } from "react";

const Fsck = () => {
  const latestValue = useLatestValueFromServerFeed<FsckType>({
    type: "rx.ng.fsck",
  });

  useEffect(() => {
    document.title = "DPMNG - fsck";
  }, []);

  return (
    <>
      <Navigate />

      <h1>fsck</h1>

      {latestValue ? (
        <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(Fsck);
