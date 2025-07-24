import Navigate from "@components/navigate";
import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import React, { useEffect } from "react";

import TagsWithCounts from "../day/TagsWithCounts";

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
              <th>Images (with exif)</th>
              <th>Videos (with mediainfo)</th>
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
                <td>{row.counts.imagesWithExif}</td>
                <td>{row.counts.videosWithMediaInfo}</td>
                <td
                  style={{
                    backgroundColor: `rgb(${255.0 * (1 - (row.counts.imagesWithGPS + row.counts.videosWithGPS) / (row.counts.imagesWithExif + row.counts.videosWithMediaInfo))}, 0, 0)`,
                  }}
                >
                  {row.counts.imagesWithGPS} / {row.counts.videosWithGPS}
                </td>
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
