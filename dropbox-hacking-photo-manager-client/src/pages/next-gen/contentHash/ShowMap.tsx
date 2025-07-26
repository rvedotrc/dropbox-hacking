import type { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
import * as L from "leaflet";
import React, { useEffect, useMemo, useRef } from "react";

export const ShowMap = ({ pos }: { pos: GPSLatLong }) => {
  const ne = useMemo(() => pos.asSigned(), [pos]);
  const eleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aMap = L.map(eleRef.current!).setView([ne.lat, ne.long], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(aMap);

    const m = L.marker([ne.lat, ne.long], {
      riseOnHover: true,
      title: "This item",
    });
    m.addTo(aMap);
    m.addEventListener("dblclick", (event) => {
      console.log({ markerEvent: event });
    });

    aMap.addEventListener("dblclick", (event) => {
      console.log({ mapEvent: event });
    });

    return () => {
      aMap.remove();
    };
  }, [ne]);

  return <div ref={eleRef} style={{ width: "600px", height: "600px" }} />;
};
