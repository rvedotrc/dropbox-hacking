import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { FileRevResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "../../samePageLink";

const NGFileRev = ({ rev }: { rev: string }) => {
  const latestValue = useLatestValueFromServerFeed<FileRevResult>({
    type: "ng.file.rev",
    rev,
  });

  return (
    <>
      <Navigate />

      <h1>Rev {rev}</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>

      {latestValue?.file && (
        <>
          <SamePageLink
            state={{
              route: "next-gen/file/id",
              id: latestValue.file.id,
            }}
          >
            {latestValue.file.id}
          </SamePageLink>
          {" / "}
          <SamePageLink
            state={{
              route: "next-gen/content-hash",
              contentHash: latestValue.file.content_hash,
            }}
          >
            {latestValue.file.content_hash}
          </SamePageLink>

          <hr />

          <SamePageLink
            state={{
              route: "next-gen/day/files",
              date: latestValue.file.client_modified.substring(0, 10),
            }}
          >
            {latestValue.file.client_modified.substring(0, 10)}
          </SamePageLink>
        </>
      )}
    </>
  );
};

export default logRender(NGFileRev);
