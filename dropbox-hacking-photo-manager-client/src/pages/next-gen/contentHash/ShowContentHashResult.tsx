import GeoMap from "@components/map/GeoMap";
import ShowData from "@components/ShowData";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
import type { ContentHashCollection } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import * as L from "leaflet";
import React from "react";

import EditablePhotoEntry from "./EditablePhotoEntry";
import ImagePreview from "./imagePreview";
import SummariseExif from "./SummariseExif";
import SummariseMediaInfo from "./SummariseMediaInfo";
import SummariseNamedFiles from "./SummariseNamedFiles";

export const ShowContentHashResult = ({
  contentHash,
  latestValue,
}: {
  contentHash: string;
  latestValue: ContentHashCollection;
}) => {
  return (
    <>
      <ShowData data={latestValue} />

      <div style={{ display: "flex", flexDirection: "row" }}>
        <ImagePreview
          namedFile={latestValue.namedFiles[0]}
          photo={latestValue.photo ?? {}}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {latestValue.exif && <SummariseExif exif={latestValue.exif} />}
          {latestValue.mediaInfo && (
            <SummariseMediaInfo mediaInfo={latestValue.mediaInfo} />
          )}

          <div style={{ marginBlock: "1em" }}>
            <EditablePhotoEntry
              contentHash={contentHash}
              photoDbEntry={latestValue.photo ?? {}}
            />
          </div>

          <p>Rotation: {latestValue.photo?.rotate ?? 0}°</p>

          {latestValue.gps ? (
            <>
              <div style={{ marginBlock: "1em" }}>
                <GeoMap
                  positions={
                    new Map([
                      [
                        contentHash,
                        {
                          position: new L.LatLng(
                            latestValue.gps.lat,
                            latestValue.gps.long,
                          ),
                          highlighted: false,
                        },
                      ],
                    ])
                  }
                />
              </div>
              <p className="gps">
                <a
                  href={GPSLatLong.fromGPSLatNLongE(
                    latestValue.gps,
                  ).googleMapsUrl({ zoom: 15 })}
                >
                  Google Maps
                </a>
                {" | "}
                <a
                  href={GPSLatLong.fromGPSLatNLongE(latestValue.gps).geoHackUrl(
                    { title: "no title" },
                  )}
                >
                  GeoHack
                </a>
              </p>
            </>
          ) : (
            <p className="no-gps">[no GPS information]</p>
          )}

          <SummariseNamedFiles namedFiles={latestValue.namedFiles} />
        </div>
      </div>
    </>
  );
};
