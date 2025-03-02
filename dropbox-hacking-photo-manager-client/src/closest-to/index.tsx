import React from "react";

import { useWebsocket } from "../context/websocket";
import type {
  ClosestToRequest,
  ClosestToResponse,
  GPSLatNLongE,
} from "dropbox-hacking-photo-manager-shared";
import { useEffect, useState } from "react";
import SamplePhoto from "../days/samplePhoto";
import SamePageLink from "../samePageLink";

export default ({
  gps,
  nClosest,
}: {
  gps: GPSLatNLongE;
  nClosest?: number;
}) => {
  const ws = useWebsocket();
  if (!ws) return null;

  const [data, setData] = useState<{
    gps: GPSLatNLongE;
    r: ClosestToResponse | null;
  }>();

  useEffect(() => {
    if (!data || gps.lat !== data.gps.lat || gps.long !== data.gps.long) {
      const toSend: ClosestToRequest = {
        verb: "closestTo",
        from: gps,
        nClosest: nClosest ?? 1000,
        maxDistanceInMeters: 10_000,
      };

      ws.simpleRequest(toSend).then(
        (r) => setData({ gps, r: r as ClosestToResponse }),
        (err) => console.error("WS error:", err),
      );

      setData({ gps, r: null });
    }
  }, [gps, data]);

  if (!data?.r) return "...";

  return (
    <div>
      <table>
        <tbody>
          {data.r.items.map((item) => {
            const date = item.photo.file.client_modified.substring(0, 10);
            return (
              <tr key={item.photo.file.rev}>
                <td>{Math.round(item.distanceInMeters)} m</td>
                <td>
                  <SamePageLink
                    href={`/day/${date}`}
                    state={{
                      route: "day",
                      date,
                    }}
                  >
                    {date}
                  </SamePageLink>
                </td>
                <td>
                  <SamePageLink
                    href={`/photo/rev/${item.photo.file.rev}`}
                    state={{
                      route: "photo",
                      rev: item.photo.file.rev,
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
      <pre>{JSON.stringify(data.r, null, 2)}</pre>
    </div>
  );
};
