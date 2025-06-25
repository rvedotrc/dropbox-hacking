import React, { useEffect } from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { ContentHashResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "../../samePageLink";
import SummariseMediaInfo from "./SummariseMediaInfo";
import SummariseExif from "./SummariseExif";

const Results = ({ latestValue }: { latestValue: ContentHashResult }) => {
  return (
    <>
      <h2>Files</h2>

      <ol>
        {latestValue.namedFiles.map((file) => (
          <li key={file.id}>
            {file.client_modified}
            {" / "}
            <SamePageLink
              routeState={{
                route: "route/next-gen/file/id",
                id: file.id,
              }}
            >
              {file.id}
            </SamePageLink>
            {" / "}
            <SamePageLink
              routeState={{
                route: "route/next-gen/file/rev",
                rev: file.rev,
              }}
            >
              {file.rev}
            </SamePageLink>
            {" / "}
            <SamePageLink
              routeState={{
                route: "route/next-gen/day/files",
                date: file.client_modified.substring(0, 10),
              }}
            >
              {file.client_modified.substring(0, 10)}
            </SamePageLink>
            {" / "}

            <a
              href={`https://www.dropbox.com/preview${file.path_lower}?context=browse&role=personal`}
            >
              View in Dropbox
            </a>
          </li>
        ))}
      </ol>

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

      <h1>Content hash {contentHash}</h1>

      {latestValue ? <Results latestValue={latestValue} /> : "Loading..."}
    </>
  );
};

export default logRender(NGContentHash);
