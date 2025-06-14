import React, { useMemo } from "react";

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

  const [data, setData] = useState<{
    gps: GPSLatNLongE;
    r: ClosestToResponse | null;
  }>();

  const [online, setOnline] = useState(false);

  const onOnline = useMemo(() => () => setOnline(true), [setOnline]);
  const onOffline = useMemo(() => () => setOnline(false), [setOnline]);

  useEffect(() => {
    if (!ws) return;

    ws.addListener("online", onOnline);
    ws.addListener("offline", onOffline);

    return () => {
      ws.removeListener("online", onOnline);
      ws.removeListener("offline", onOffline);
    };
  }, [ws]);

  useEffect(() => {
    if (!ws || !online) return;

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
  }, [ws, online, gps, data]);

  if (!data?.r) return "...";

  return (
    <div>
      <table>
        <tbody>
          {data.r.items.map((item) => {
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
      <pre>{JSON.stringify(data.r, null, 2)}</pre>
    </div>
  );
};
