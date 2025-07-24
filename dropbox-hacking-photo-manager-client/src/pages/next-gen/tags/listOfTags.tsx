import Navigate from "@components/navigate";
import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import React, { useEffect, useMemo } from "react";

const ListOfTags = () => {
  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.tags",
  });

  useEffect(() => {
    document.title = "DPMNG - tags";
  }, []);

  const listId = useMemo(
    () => "X_" + crypto.randomUUID().replaceAll(/-/g, "_"),
    [],
  );

  useStyleSheet({
    cssText: `
      #${listId} {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }

      #${listId} li {
        display: inline;
      }

      #${listId} li a {
        color: white;
        line-height: 2.5em;
        text-wrap: nowrap;
      }
    `,
  });

  return (
    <>
      <Navigate />

      <h1>Tags</h1>

      {latestValue ? (
        <ol id={listId}>
          {latestValue.tags.map(([tag, count]) => (
            <li key={tag}>
              <SamePageLink
                routeState={{
                  route: "route/next-gen/search",
                  filterText: `tag=${tag}`,
                }}
                className={`tag tag-${tag}`}
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
