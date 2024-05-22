import * as React from "react";
import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";
import { useEffect } from "react";

const formatPercent = (n: number, d: number): number =>
  Math.round((10000.0 * n) / d) / 100.0;

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

  const css = `
    .stats th, .stats td { text-align: right }
  `;

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.appendChild(document.createTextNode(css));
    document.head.appendChild(styleElement);
    return () => {
      styleElement.parentNode?.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <table className={"stats"}>
        <thead>
          <tr>
            <th></th>
            <th>Total</th>
            <th>Described</th>
            <th>%</th>
            <th>Undescribed</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Days</td>
            <td>{daysWith + daysWithout}</td>
            <td>{daysWith}</td>
            <td>{formatPercent(daysWith, daysWith + daysWithout)}</td>
            <td>{daysWithout}</td>
            <td>{formatPercent(daysWithout, daysWith + daysWithout)}</td>
          </tr>
          <tr>
            <td>Photos</td>
            <td>{photosWith + photosWithout}</td>
            <td>{photosWith}</td>
            <td>{formatPercent(photosWith, photosWith + photosWithout)}</td>
            <td>{photosWithout}</td>
            <td>{formatPercent(photosWithout, photosWith + photosWithout)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default Stats;
