import * as React from "react";

import logRender from "@lib/logRender";
import SamePageLink from "@components/samePageLink";
import { useAdditionalFeeds } from "@hooks/legacyRxFeeds/additionalFeeds";
import { useLatestValue } from "@hooks/useLatestValue";
import { map } from "rxjs/operators";
import { useMemo } from "react";
import ListOfDaysWithData from "../days/listOfDaysWithData";
import { useRxFeedsViaMultiplexer } from "@hooks/legacyRxFeeds/rxRecordFeedContext";

const Month = ({ month }: { month: string }): React.ReactElement | null => {
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
            const months = [
              ...new Set(counts.map((t) => t[0].substring(0, 7))),
            ];
            const previousMonth = months
              .filter((t) => t.localeCompare(month) < 0)
              .toSorted()
              .pop();
            const nextMonth = months
              .filter((t) => t.localeCompare(month) > 0)
              .toSorted()
              .shift();
            return { previousMonth, nextMonth };
          }),
        ),
      [justCountsByDateFeed, month],
    ),
  );

  const feed = useLatestValue(
    useMemo(
      () =>
        useAdditionalFeeds()?.countsByDate.pipe(
          map((v) => v.filter((item) => item.date.startsWith(month))),
        ),
      [month],
    ),
  );

  const parentYear = month.substring(0, 4);

  const latestReplayImage = useLatestValue(useRxFeedsViaMultiplexer()?.days);
  const dayMetadata = latestReplayImage
    ? Object.values(latestReplayImage.image)
    : undefined;

  return (
    <>
      <div className="navigation">
        <ul>
          <li>
            🔼{" "}
            <SamePageLink
              routeState={{
                route: "year",
                year: parentYear,
              }}
            >
              {parentYear}
            </SamePageLink>
          </li>

          {prevNext?.previousMonth && (
            <li>
              {"◀️ "}
              <SamePageLink
                routeState={{
                  route: "month",
                  month: prevNext.previousMonth,
                }}
              >
                {prevNext.previousMonth}
              </SamePageLink>
            </li>
          )}

          {prevNext?.nextMonth && (
            <>
              <li>
                {"▶️ "}
                <SamePageLink
                  routeState={{
                    route: "month",
                    month: prevNext.nextMonth,
                  }}
                >
                  {prevNext.nextMonth}
                </SamePageLink>
              </li>
            </>
          )}
        </ul>
      </div>

      <h1>{month}</h1>

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

export default logRender(Month);
