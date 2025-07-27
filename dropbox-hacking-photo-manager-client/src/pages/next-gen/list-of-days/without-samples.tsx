import Navigate from "@components/navigate";
import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import React, { useEffect } from "react";

import TagsWithCounts from "../day/TagsWithCounts";

const XOutOfY = ({ x, y }: { x: number; y: number }) =>
  y === 0 ? (
    <td />
  ) : (
    <td
      style={{
        backgroundColor: `rgb(${255.0 * (1 - x / y)}, 0, 0)`,
      }}
    >
      {x} / {y}
    </td>
  );

const NGDaysNoSamples = () => {
  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.list-of-days",
    withSamples: false,
  });

  useEffect(() => {
    document.title = "DPMNG - Plain list of days";
  }, []);

  return (
    <>
      <Navigate />

      <h1>List of days (no samples)</h1>

      {latestValue ? (
        <table {...{ border: 1 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>EXIF</th>
              <th>MediaInfo</th>
              <th>GPS</th>
              <th>Description</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {latestValue.map((row) => (
              <tr key={row.date}>
                <td>
                  <SamePageLink
                    routeState={{
                      route: "route/next-gen/day/files",
                      date: row.date,
                    }}
                  >
                    {row.date}
                  </SamePageLink>
                </td>
                <XOutOfY
                  x={row.counts.hasExifCount}
                  y={row.counts.exifableCount}
                />
                <XOutOfY
                  x={row.counts.hasMediaInfoCount}
                  y={row.counts.mediaInfoableCount}
                />
                <XOutOfY
                  x={row.counts.hasGPSCount}
                  y={row.counts.previewableCount}
                />
                <td>{row.dayMetadata?.description ?? ""}</td>
                <td>
                  <TagsWithCounts tags={row.photoTags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        "loading ..."
      )}
    </>
  );
};
//x

export default logRender(NGDaysNoSamples);
