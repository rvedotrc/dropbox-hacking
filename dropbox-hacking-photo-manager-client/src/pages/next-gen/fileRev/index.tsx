import React, { useEffect } from "react";

import logRender from "@/logRender";
import Navigate from "@/pages/legacy/days/navigate";
import type { FileRevResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "@/components/samePageLink";

const NGFileRev = ({ rev }: { rev: string }) => {
  const latestValue = useLatestValueFromServerFeed<FileRevResult>({
    type: "rx.ng.file.rev",
    rev,
  });

  useEffect(() => {
    document.title = `DPMNG - rev ${rev}`;
  }, []);

  return (
    <>
      <Navigate />

      <h1>Rev {rev}</h1>

      {/* <p>
        <EditableTextField
          key={photoDbEntry?.description ?? ""}
          value={photoDbEntry?.description ?? ""}
          onSave={onSaveDescription}
        />
      </p>

      <p>
        <EditableTextField
          key={photoDbEntry?.tags?.join(" ") ?? ""}
          value={photoDbEntry?.tags?.join(" ") ?? ""}
          onSave={onSaveTags}
        />
      </p> */}

      <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>

      {latestValue?.file && (
        <>
          <p>
            <a
              href={`https://www.dropbox.com/preview${latestValue.file.path_lower}?context=browse&role=personal`}
            >
              View in Dropbox
            </a>
          </p>

          <SamePageLink
            routeState={{
              route: "route/next-gen/file/id",
              id: latestValue.file.id,
            }}
          >
            {latestValue.file.id}
          </SamePageLink>
          {" / "}
          <SamePageLink
            routeState={{
              route: "route/next-gen/content-hash",
              contentHash: latestValue.file.content_hash,
            }}
          >
            {latestValue.file.content_hash}
          </SamePageLink>

          <hr />

          <SamePageLink
            routeState={{
              route: "route/next-gen/day/files",
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
