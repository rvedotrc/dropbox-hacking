import React, { useEffect } from "react";

import logRender from "@/logRender";
import Navigate from "../../days/navigate";
import type { FileIdResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import {
  urlForState,
  type RouteState,
} from "dropbox-hacking-photo-manager-shared";
import useRouter from "@/hooks/useRouter";

const NGFileId = ({ id }: { id: string }) => {
  const latestValue = useLatestValueFromServerFeed<FileIdResult>({
    type: "rx.ng.file.id",
    id,
  });

  const router = useRouter();

  useEffect(() => {
    if (latestValue?.file) {
      const routeState: RouteState = {
        route: "route/next-gen/file/rev",
        rev: latestValue.file.rev,
      };
      const href = urlForState(routeState);
      window.history.pushState(routeState, "unused", href);
      router.switchToPage(routeState);
    }
  }, [id, latestValue?.file?.rev]);

  return (
    <>
      <Navigate />

      <h1>ID {id}</h1>

      {latestValue?.file ? (
        <>Redirecting...</>
      ) : (
        <>
          <p>No such file</p>
        </>
      )}
    </>
  );
};

export default logRender(NGFileId);
