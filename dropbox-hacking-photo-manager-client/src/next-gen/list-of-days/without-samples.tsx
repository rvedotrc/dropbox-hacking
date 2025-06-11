import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { NGDaysNoSamplesType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import SamePageLink from "../../samePageLink";

const NGDaysNoSamples = () => {
  const latestValue = useLatestValueFromServerFeed<NGDaysNoSamplesType>({
    type: "ng.list-of-days",
    withSamples: false,
  });

  return (
    <>
      <Navigate />

      <h1>List of days (no samples)</h1>

      {latestValue ? (
        <table {...{ border: 1 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Images</th>
              <th>Images with EXIF</th>
              <th>Videos</th>
              <th>Videos with MediaInfo</th>
            </tr>
          </thead>
          <tbody>
            {latestValue.map((row) => (
              <tr key={row.date}>
                <td>
                  <SamePageLink
                    state={{
                      route: "next-gen/day/files",
                      date: row.date,
                    }}
                  >
                    {row.date}
                  </SamePageLink>
                </td>
                <td>{row.counts.images}</td>
                <td>{row.counts.imagesWithExif}</td>
                <td>{row.counts.videos}</td>
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
