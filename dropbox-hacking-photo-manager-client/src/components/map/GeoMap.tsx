import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import * as L from "leaflet";
import React, { useEffect, useMemo, useRef } from "react";

type P = {
  position: L.LatLng;
  highlighted: boolean;
};

export type Positions = ReadonlyMap<string, P>;

const findBoundingBox = (
  positions: readonly L.LatLng[],
): { center: L.LatLng; halfDiagonal: number } => {
  let minLat = +Infinity;
  let maxLat = -Infinity;
  let minLng = +Infinity;
  let maxLng = -Infinity;

  for (const position of positions) {
    if (position.lat < minLat) minLat = position.lat;
    if (position.lat > maxLat) maxLat = position.lat;
    if (position.lng < minLng) minLng = position.lng;
    if (position.lng > maxLng) maxLng = position.lng;
  }

  const center = new L.LatLng((minLat + maxLat) / 2, (minLng + maxLng) / 2);

  const halfDiagonal = center.distanceTo({ lat: maxLat, lng: maxLng });

  return { center, halfDiagonal };
};

const findInitialZoom = (halfDiagonal: number) => {
  let initialZoom = 18 - Math.ceil(Math.log(halfDiagonal / 100) / Math.log(2));
  if (initialZoom < 0) initialZoom = 0;
  if (initialZoom > 19) initialZoom = 19;
  return initialZoom;
};

const GeoMap = ({ positions }: { positions: Positions }) => {
  if (positions.size === 0) return;

  useStyleSheet({
    cssText: `
      .iconA {
        filter: hue-rotate(20deg);
      }
      .iconB {
        filter: hue-rotate(140deg);
      }
    `,
  });

  const { center, halfDiagonal } = findBoundingBox(
    [...positions.values()].map((p) => p.position),
  );

  const initialZoom = findInitialZoom(halfDiagonal);

  const eleRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const theMap = L.map(eleRef.current!);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(theMap);

    L.control.scale({ maxWidth: 550 }).addTo(theMap);

    mapRef.current = theMap;

    return () => void theMap.remove();
  }, []);

  useEffect(() => {
    mapRef.current?.setView(center, initialZoom);
  }, [center.lat, center.lng, initialZoom]);

  const iconA = useMemo(() => new L.Icon.Default({ className: "iconA" }), []);
  const iconB = useMemo(() => new L.Icon.Default({ className: "iconB" }), []);
  const markersRef = useRef(new Map<string, P & { marker: L.Marker }>());

  useEffect(() => {
    const theMap = mapRef.current;
    const markers = markersRef.current;
    if (!theMap || !markers) return;

    for (const [id, details] of [...markers.entries()]) {
      if (!positions.has(id)) {
        details.marker.remove();
        markers.delete(id);
      }
    }

    for (const [id, newDetails] of [...positions.entries()]) {
      const oldDetails = markers.get(id);

      if (!oldDetails) {
        const marker = L.marker(newDetails.position, {
          riseOnHover: true,
          title: id,
          icon: newDetails.highlighted ? iconB : iconA,
        });
        marker.addTo(theMap);

        markers.set(id, {
          ...newDetails,
          marker,
        });
      } else {
        const marker = oldDetails.marker;
        if (!newDetails.position.equals(oldDetails.position, 5)) {
          marker.setLatLng(newDetails.position);
          oldDetails.position = newDetails.position;
        }
        if (newDetails.highlighted !== oldDetails.highlighted) {
          marker.setIcon(newDetails.highlighted ? iconB : iconA);
          oldDetails.highlighted = newDetails.highlighted;
        }
      }
    }
  });

  return (
    <div>
      <div ref={eleRef} style={{ width: "600px", height: "600px" }} />
    </div>
  );
};

export default logRender(GeoMap);
