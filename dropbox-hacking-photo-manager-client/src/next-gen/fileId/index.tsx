import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { FileIdResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "../../samePageLink";

const NGFileId = ({ id }: { id: string }) => {
  const latestValue = useLatestValueFromServerFeed<FileIdResult>({
    type: "ng.file.id",
    id,
  });

  return (
    <>
      <Navigate />

      <h1>ID {id}</h1>

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>

      {latestValue?.file && (
        <>
          <SamePageLink
            state={{
              route: "next-gen/file/rev",
              rev: latestValue.file.rev,
            }}
          >
            {latestValue.file.rev}
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

export default logRender(NGFileId);
