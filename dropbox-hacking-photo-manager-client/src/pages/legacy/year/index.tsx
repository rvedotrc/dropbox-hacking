import SamePageLink from "@components/samePageLink";
import { useAdditionalFeeds } from "@hooks/legacyRxFeeds/additionalFeeds";
import { useRxFeedsViaMultiplexer } from "@hooks/legacyRxFeeds/rxRecordFeedContext";
import { useLatestValue } from "@hooks/useLatestValue";
import logRender from "@lib/logRender";
import * as React from "react";
import { useMemo } from "react";
import { map } from "rxjs/operators";

import ListOfDaysWithData from "../days/listOfDaysWithData";

const Year = ({ year }: { year: string }): React.ReactElement | null => {
  const feeds = useAdditionalFeeds();
  if (!feeds) return null;

  const justCountsByDateFeed = useMemo(
    () =>
      feeds?.countsByDate.pipe(
        map((v) => v.map((item) => [item.date, item.count] as const)),
      ),
    [feeds],
  );

  const prevNext = useLatestValue(
    useMemo(
      () =>
        justCountsByDateFeed.pipe(
          map((counts) => {
            const years = [...new Set(counts.map((t) => t[0].substring(0, 4)))];
            const previousYear = years
              .filter((t) => t.localeCompare(year) < 0)
              .toSorted()
              .pop();
            const nextYear = years
              .filter((t) => t.localeCompare(year) > 0)
              .toSorted()
              .shift();
            return { previousYear, nextYear };
          }),
        ),
      [justCountsByDateFeed, year],
    ),
  );

  const feed = useLatestValue(
    useMemo(
      () =>
        useAdditionalFeeds()?.countsByDate.pipe(
          map((v) => v.filter((item) => item.date.startsWith(year))),
        ),
      [year],
    ),
  );

  const latestReplayImage = useLatestValue(useRxFeedsViaMultiplexer()?.days);
  const dayMetadata = latestReplayImage
    ? Object.values(latestReplayImage.image)
    : undefined;

  return (
    <>
      <div className="navigation">
        <ul>
          {prevNext?.previousYear && (
            <li>
              {"◀️ "}
              <SamePageLink
                routeState={{
                  route: "year",
                  year: prevNext.previousYear,
                }}
              >
                {prevNext.previousYear}
              </SamePageLink>
            </li>
          )}

          {prevNext?.nextYear && (
            <>
              <li>
                {"▶️ "}
                <SamePageLink
                  routeState={{
                    route: "year",
                    year: prevNext.nextYear,
                  }}
                >
                  {prevNext.nextYear}
                </SamePageLink>
              </li>
            </>
          )}
        </ul>
      </div>

      <h1>{year}</h1>

      {feed && (
        <>
          <ListOfDaysWithData
            countsByDate={feed}
            dayMetadata={dayMetadata ?? []}
            withSamples={true}
          />
        </>
      )}
    </>
  );
};

export default logRender(Year);
