import React, { useEffect } from "react";

import logRender from "@lib/logRender";
import Navigate from "@components/navigate";
import type { TagsType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import SamePageLink from "@components/samePageLink";

const ListOfTags = () => {
  const latestValue = useLatestValueFromServerFeed<TagsType>({
    type: "rx.ng.tags",
  });

  useEffect(() => {
    document.title = "DPMNG - tags";
  }, []);

  return (
    <>
      <Navigate />

      <h1>Tags</h1>

      {latestValue ? (
        <ol>
          {latestValue.tags.map(([tag, count]) => (
            <li key={tag}>
              <SamePageLink
                routeState={{
                  route: "route/next-gen/tags",
                  tag,
                }}
              >
                {tag} ({count})
              </SamePageLink>
            </li>
          ))}
        </ol>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(ListOfTags);
