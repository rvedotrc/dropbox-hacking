import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CountsByDate,
  DayMetadata,
} from "dropbox-hacking-photo-manager-shared";

import { useDaysMetadata } from "../context/daysMetadataContext";
import { useCountsByDate } from "../context/countsByDateContext";
import logRender from "../logRender";
import DayWithSamples, { dayDateAttribute } from "./dayWithSamples";
import Stats from "./stats";
import useVisibilityTracking from "./trackListVisibility";
import DefaultThumbnailLoaderProvider from "./thumbnailLoaderContext";
import Navigate from "./navigate";

const ListOfDaysWithData = ({
  countsByDate,
  dayMetadata,
  withSamples,
}: {
  countsByDate: CountsByDate;
  dayMetadata: DayMetadata[];
  withSamples: boolean;
}) => {
  const [visibleDates, setVisibleDates] = useState<[string, string]>();
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

  useVisibilityTracking(olRef, dayDateAttribute, setVisibleDates, [days]);

  return (
    <div>
      <h1>List of Days</h1>

      <Navigate />

      <Stats days={days} />

      <ol ref={olRef} className={"listOfDays"}>
        {days.map((day) => (
          <DayWithSamples
            key={day.date}
            day={day}
            withSamples={withSamples}
            visible={
              visibleDates
                ? day.date >= visibleDates[0] && day.date <= visibleDates[1]
                : false
            }
          />
        ))}
      </ol>
    </div>
  );
};

const ListOfDays = ({ withSamples }: { withSamples: boolean }) => {
  const countsByDate = useCountsByDate();
  const dayMetadata = useDaysMetadata();

  useEffect(() => {
    document.title = "DPM - Days";
  }, []);

  if (!countsByDate || !dayMetadata) {
    return <div>Loading...</div>;
  } else {
    return (
      <DefaultThumbnailLoaderProvider>
        <ListOfDaysWithData
          countsByDate={countsByDate}
          dayMetadata={dayMetadata}
          withSamples={withSamples}
        />
      </DefaultThumbnailLoaderProvider>
    );
  }
};

export default logRender(ListOfDays);
