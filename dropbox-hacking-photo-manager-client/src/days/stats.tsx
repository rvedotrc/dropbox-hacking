import * as React from "react";
import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";

const Stats = ({
  days,
}: {
  days: (CountsByDateEntry & { description: string })[];
}) => {
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
    <>
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
    </>
  );
};

export default Stats;
