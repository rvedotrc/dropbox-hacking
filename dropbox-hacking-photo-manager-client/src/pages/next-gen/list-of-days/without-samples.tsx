import React, { useEffect } from "react";

import logRender from "@/logRender";
import Navigate from "@/days/navigate";
import type { NGDaysNoSamplesType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "@/components/samePageLink";

const NGDaysNoSamples = () => {
  const latestValue = useLatestValueFromServerFeed<NGDaysNoSamplesType>({
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
              <th>Description</th>
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
                <td>{row.dayMetadata?.description ?? ""}</td>
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
