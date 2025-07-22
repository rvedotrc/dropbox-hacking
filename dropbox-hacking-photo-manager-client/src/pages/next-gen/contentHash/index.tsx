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
  context?: { date: string; rev: string };
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
          key={`${context.date} ${context.rev}`}
          context={context}
        />
      )}

      <h1>Content hash {contentHash.substring(0, 10)}</h1>

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
