import * as React from "react";
import {
  CountsByDate,
  DayMetadata,
} from "dropbox-hacking-photo-manager-shared";
import { useMemo, useRef, useState } from "react";
import useVisibilityTracking from "./useVisibilityTracking";
import DayWithSamples, { dayDateAttribute } from "./dayWithSamples";
import Navigate from "./navigate";
import Stats from "./stats";
import logRender from "../logRender";

const ListOfDaysWithData = ({
  countsByDate,
  dayMetadata,
  withSamples,
}: {
  countsByDate: CountsByDate;
  dayMetadata: DayMetadata[];
  withSamples: boolean;
}) => {
  const [visibleDates, setVisibleDates] = useState<Set<string>>();
  const olRef = useRef<HTMLOListElement>(null);

  // console.log("render ", { visibleDates });

  const keyedMetadata = useMemo(
    () => new Map<string, DayMetadata>(dayMetadata.map((m) => [m.date, m])),
    [dayMetadata],
  );

  const days = useMemo(
    () =>
      countsByDate.map((e) => ({
        ...e,
        description: (keyedMetadata.get(e.date) || { description: "" })
          .description,
      })),
    [countsByDate, keyedMetadata],
  );

  useVisibilityTracking({
    parentRef: olRef,
    listItemDataAttribute: dayDateAttribute,
    onVisibleItems: setVisibleDates,
    deps: [days],
  });

  return (
    <div>
      <h1>List of Days</h1>

      <Navigate />

      <Stats days={days} />

      <p>Date; count of pics; of which with GPS</p>

      <ol ref={olRef} className={"listOfDays"}>
        {days.map((day) => (
          <DayWithSamples
            key={day.date}
            day={day}
            withSamples={withSamples}
            visible={visibleDates?.has(day.date) || false}
          />
        ))}
      </ol>
    </div>
  );
};

export default logRender(ListOfDaysWithData);
