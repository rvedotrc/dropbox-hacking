import logRender from "@lib/logRender";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
import * as L from "leaflet";
import React, { useEffect, useRef } from "react";

type P = {
  position: GPSLatLong;
  contentHash: string;
};

// const meanAverageOf = (items: number[]): number =>
//   items.length > 0
//     ? items.reduce((acc, item) => acc + item, 0) / items.length
//     : NaN;

// const averageOf = (positions: GPSLatNLongE[]): GPSLatNLongE => ({
//   lat: meanAverageOf(positions.map((p) => p.lat)),
//   long: meanAverageOf(positions.map((p) => p.long)),
// });

// const maxOf = (items: number[]): number =>
//   items.length > 0
//     ? items.reduce((acc, item) => (item > acc ? item : acc), -Infinity)
//     : NaN;

const ShowMap = ({ positions }: { positions: P[] }) => {
  if (positions.length === 0) return;

  let minLat = +Infinity;
  let maxLat = -Infinity;
  let minLong = +Infinity;
  let maxLong = -Infinity;

  for (const position of positions.map((p) => p.position.asSigned())) {
    if (position.lat < minLat) minLat = position.lat;
    if (position.lat > maxLat) maxLat = position.lat;
    if (position.long < minLong) minLong = position.long;
    if (position.long > maxLong) maxLong = position.long;
  }

  const centerPos = {
    lat: (minLat + maxLat) / 2,
    long: (minLong + maxLong) / 2,
  };

  const c2 = GPSLatLong.fromGPSLatNLongE(centerPos);

  // console.log({ c2 });

  const halfDiagonal = c2.distanceFrom(
    GPSLatLong.fromGPSLatNLongE({ lat: maxLat, long: maxLong }),
  );

  // At the equator:
  // zoom 19 -> good for focusing on 100m x 100m
  // and it's a log-2 scale.

  let initialZoom = 18 - Math.ceil(Math.log(halfDiagonal / 100) / Math.log(2));
  if (initialZoom < 0) initialZoom = 0;
  if (initialZoom > 19) initialZoom = 19;

  const eleRef = useRef<HTMLDivElement>(null);

  // const [currentZoom, setCurrentZoom] = useState(initialZoom);

  useEffect(() => {
    const aMap = L.map(eleRef.current!).setView(
      [centerPos.lat, centerPos.long],
      initialZoom,
    );

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(aMap);

    L.control.scale({ maxWidth: 550 }).addTo(aMap);

    for (const item of positions) {
      const marker = L.marker(
        [item.position.asSigned().lat, item.position.asSigned().long],
        {
          riseOnHover: true,
          title: item.contentHash,
        },
      );
      marker.addTo(aMap);

      // marker.addEventListener("dblclick", (_event) =>
      //   console.log(`Switch to ${item.contentHash}`),
      // );
    }

    // aMap.addEventListener("dblclick", (event) => {
    //   console.log({ mapEvent: event });
    // });

    // aMap.on("zoom", (event) => setCurrentZoom(event.sourceTarget._zoom));

    // At the equator:
    // 0: whole world 2+ times
    // 1: whole world 1+ times
    // 2: 55% = 10000km
    // 3: 90% = 10000km
    // 4: 90% = 5000km
    // 5: 70% = 2000km
    // 6: 70% = 1000km
    // 7: 70% = 500km
    // 8: 85% = 300km
    // 9: 55% = 100km
    // 10: 55% = 50km
    // 11: 65% = 30km
    // 12: 90% = 20km
    // 13: 90% = 10km
    // 14: 90% = 5km  5555
    // 15: 70% = 2km  2857
    // 16: 70% = 1km
    // 17: 70% = 500m  \
    // 18: 90% = 300m  |
    // 19: 55% = 100m  /

    aMap.on("zoom", (event) => console.log({ "map.zoom": event }));

    // aMap.on("zoomlevelschange", (event) =>
    //   console.log({ "map.zoomlevelschange": event }),
    // );

    return () => {
      aMap.remove();
    };
  }, [positions]);

  return (
    <div>
      <div ref={eleRef} style={{ width: "600px", height: "600px" }} />
      {/* <p>
        {halfDiagonal} / {initialZoom} / curr={currentZoom}
      </p> */}
    </div>
  );
};

export default logRender(ShowMap);
