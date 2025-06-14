import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { ContentHashResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "../../samePageLink";

const NGContentHash = ({ contentHash }: { contentHash: string }) => {
  const latestValue = useLatestValueFromServerFeed<ContentHashResult>({
    type: "rx.ng.content_hash",
    contentHash,
  });

  return (
    <>
      <Navigate />

      <h1>Content hash {contentHash}</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>

      {latestValue && (
        <>
          <h2>Files</h2>
          <ol>
            {latestValue.files.map((file) => (
              <li key={file.id}>
                {file.client_modified}
                {" / "}
                <SamePageLink
                  state={{
                    route: "route/next-gen/file/id",
                    id: file.id,
                  }}
                >
                  {file.id}
                </SamePageLink>
                {" / "}
                <SamePageLink
                  state={{
                    route: "route/next-gen/file/rev",
                    rev: file.rev,
                  }}
                >
                  {file.rev}
                </SamePageLink>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
};

export default logRender(NGContentHash);
