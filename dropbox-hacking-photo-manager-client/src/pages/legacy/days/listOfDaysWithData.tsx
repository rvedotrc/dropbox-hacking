import Navigate from "@components/navigate";
import useVisibilityTracking from "@hooks/useVisibilityTracking";
import logRender from "@lib/logRender";
import {
  CountsByDate,
  DayMetadata,
} from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useMemo, useRef } from "react";

import DayWithSamples, { dayDateAttribute } from "./dayWithSamples";
import { makeEmittableSubscribable } from "./emittableSubscribable";

const ListOfDaysWithData = ({
  countsByDate,
  dayMetadata,
  withSamples,
}: {
  countsByDate: CountsByDate;
  dayMetadata: DayMetadata[];
  withSamples: boolean;
}): React.ReactElement | null => {
  const [_e, s] = useMemo(
    () => makeEmittableSubscribable<{ date: string; visible: boolean }>(),
    [],
  );

  // const diffEmitter = useMemo(() => {
  //   const previouslyVisibleDates = new Set<string>();

  //   return (visibleDates: Set<string>): void => {
  //     for (const date of visibleDates) {
  //       if (!previouslyVisibleDates.has(date)) {
  //         previouslyVisibleDates.add(date);
  //         e.emit({ date, visible: true });
  //       }
  //     }

  //     for (const date of previouslyVisibleDates) {
  //       if (!visibleDates.has(date)) {
  //         previouslyVisibleDates.delete(date);
  //         e.emit({ date, visible: false });
  //       }
  //     }
  //   };
  // }, []);

  // const [visibleDates, setVisibleDates] = useState<Set<string>>();
  const olRef = useRef<HTMLOListElement>(null);

  // console.log("render ", { visibleDates });

  const keyedMetadata = useMemo(
    () => new Map<string, DayMetadata>(dayMetadata.map((m) => [m.date, m])),
    [dayMetadata],
  );

  const days = useMemo(
    () =>
      countsByDate.map((e2) => ({
        ...e2,
        description: (keyedMetadata.get(e2.date) || { description: "" })
          .description,
      })),
    [countsByDate, keyedMetadata],
  );

  if (new Date().getTime() === 0)
    useVisibilityTracking({
      parentRef: olRef,
      listItemDataAttribute: dayDateAttribute,
      // onVisibleItems: diffEmitter,
      // deps: [days],
    });

  return (
    <div>
      <Navigate />

      <h1>List of Days</h1>

      <p>Date; count of pics; of which with GPS</p>

      <ol ref={olRef} className={"listOfDays"}>
        {days.map((day) => (
          <DayWithSamples
            key={day.date}
            day={day}
            withSamples={withSamples}
            s={s}
            // visible={visibleDates?.has(day.date) || false}
          />
        ))}
      </ol>
    </div>
  );
};

export default logRender(ListOfDaysWithData);
