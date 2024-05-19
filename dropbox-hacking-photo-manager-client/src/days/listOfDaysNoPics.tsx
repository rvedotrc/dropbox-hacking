import * as React from "react";
import { useEffect } from "react";
import { DayMetadata, Payload } from "dropbox-hacking-photo-manager-shared";

import SamePageLink from "../samePageLink";
import { useDaysMetadata } from "../context/daysMetadataContext";
import { useCountsByDate } from "../context/countsByDateContext";

const ListOfDaysNoPics = ({
  setState,
}: {
  setState: (payload: Payload) => void;
}) => {
  const countsByDate = useCountsByDate();
  const dayMetadata = useDaysMetadata();

  useEffect(() => {
    document.title = "DPM - Days (plain list)";
  });

  if (!countsByDate || !dayMetadata) {
    return <div>Loading...</div>;
  }

  const keyedMetadata = new Map<string, DayMetadata>(
    dayMetadata.map((m) => [m.date, m]),
  );
  const days = countsByDate.map((e) => ({
    ...e,
    description: (keyedMetadata.get(e.date) || { description: "" }).description,
  }));

  let daysWith = 0;
  let daysWithout = 0;
  let photosWith = 0;
  let photosWithout = 0;

  for (const day of days) {
    if (day.description !== "") {
      ++daysWith;
      photosWith += day.count;
    } else {
      ++daysWithout;
      photosWithout += day.count;
    }
  }

  return (
    <div>
      <h1>List of Days</h1>

      <p>
        <SamePageLink
          href={"/calendar"}
          state={{ route: "calendar" }}
          setState={setState}
        >
          Calendar
        </SamePageLink>
        {" | "}
        <SamePageLink
          href={"/days"}
          state={{ route: "days" }}
          setState={setState}
        >
          List of days
        </SamePageLink>
      </p>

      <p>
        Days with; without; percent-with; count = {daysWith}; {daysWithout};{" "}
        {Math.round(((100.0 * daysWith) / (daysWith + daysWithout)) * 100.0) /
          100.0}
        ; {daysWith + daysWithout}
      </p>

      <p>
        Photos with; without; percent-with; count = {photosWith};{" "}
        {photosWithout};{" "}
        {Math.round(
          ((100.0 * photosWith) / (photosWith + photosWithout)) * 100.0,
        ) / 100.0}
        ; {photosWith + photosWithout}
      </p>

      <ol className={"listOfDays"}>
        {days.map((day) => (
          <li key={day.date}>
            <SamePageLink
              state={{ route: "day", date: day.date }}
              setState={setState}
              href={`/day/${day.date}`}
            >
              <span className={"date"}>{day.date}</span>
              <span className={"count"}>{day.count}</span>
              <span className={"countWithGps"}>{day.countWithGps}</span>
              <span className={"description"}>
                {day.description === undefined ? "-" : day.description}
              </span>
            </SamePageLink>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ListOfDaysNoPics;
