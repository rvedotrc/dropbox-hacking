import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import type {
  ClosestToResponse,
  GPSLatNLongE,
} from "dropbox-hacking-photo-manager-shared";
import React from "react";

import SamplePhoto from "../days/samplePhoto";

export default ({
  gps,
  nClosest,
}: {
  gps: GPSLatNLongE;
  nClosest?: number;
}) => {
  const data = useLatestValueFromServerFeed<ClosestToResponse>({
    type: "rx.ng.closest-to",
    from: gps,
    nClosest: nClosest ?? 100,
    maxDistanceInMeters: 2000,
  });

  return data ? (
    <div>
      <table>
        <tbody>
          {data.items.map((item) => {
            const date = item.photo.namedFile.client_modified.substring(0, 10);
            return (
              <tr key={item.photo.namedFile.rev}>
                <td>{Math.round(item.distanceInMeters)} m</td>
                <td>
                  <SamePageLink
                    routeState={{
                      route: "day",
                      date,
                    }}
                  >
                    {date}
                  </SamePageLink>
                </td>
                <td>
                  <SamePageLink
                    routeState={{
                      route: "photo",
                      rev: item.photo.namedFile.rev,
                    }}
                  >
                    <SamplePhoto photo={item.photo} visible={true} />
                  </SamePageLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <hr />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  ) : (
    "loading..."
  );
};
