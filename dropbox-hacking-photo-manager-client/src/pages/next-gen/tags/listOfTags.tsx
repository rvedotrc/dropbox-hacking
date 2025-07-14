import Navigate from "@components/navigate";
import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import React, { useEffect } from "react";

const ListOfTags = () => {
  const latestValue = useLatestValueFromServerFeed({
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
