import Navigate from "@components/navigate";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import React, { useEffect } from "react";

import { PrevNextFileNav } from "./PrevNextFileNav";
import { ShowContentHashResult } from "./ShowContentHashResult";

const NGContentHash = ({
  contentHash,
  context,
}: {
  contentHash: string;
  context?: { date: string; contentHash: string };
}) => {
  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.content_hash",
    contentHash,
  });

  useEffect(() => {
    document.title = "DPMNG - Content hash";
  }, []);

  return (
    <>
      <Navigate />
      {context && (
        <PrevNextFileNav
          key={`${context.date} ${context.contentHash}`}
          context={context}
        />
      )}

      {latestValue ? (
        <>
          <ShowContentHashResult
            contentHash={contentHash}
            latestValue={latestValue}
          />
        </>
      ) : (
        "Loading..."
      )}
    </>
  );
};

export default logRender(NGContentHash);
