import React, { useEffect } from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { ContentHashResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SummariseMediaInfo from "./SummariseMediaInfo";
import SummariseExif from "./SummariseExif";
import SummariseNamedFiles from "./SummariseNamedFiles";
import ImagePreview from "./imagePreview";

const Results = ({ latestValue }: { latestValue: ContentHashResult }) => {
  return (
    <>
      <ImagePreview namedFile={latestValue.namedFiles[0]} />

      <h2>Files</h2>

      <SummariseNamedFiles namedFiles={latestValue.namedFiles} />

      <h2>Exif</h2>

      {latestValue.exif !== null ? (
        <SummariseExif exif={latestValue.exif} />
      ) : (
        <p>none</p>
      )}

      <h2>MediaInfo</h2>

      {latestValue.mediainfo !== null ? (
        <SummariseMediaInfo mediaInfo={latestValue.mediainfo} />
      ) : (
        <p>none</p>
      )}
    </>
  );
};

const NGContentHash = ({ contentHash }: { contentHash: string }) => {
  const latestValue = useLatestValueFromServerFeed<ContentHashResult>({
    type: "rx.ng.content_hash",
    contentHash,
  });

  useEffect(() => {
    document.title = "DPMNG - Content hash";
  }, []);

  return (
    <>
      <Navigate />

      <h1>Content hash {contentHash.substring(0, 10)}</h1>

      {latestValue ? <Results latestValue={latestValue} /> : "Loading..."}
    </>
  );
};

export default logRender(NGContentHash);
