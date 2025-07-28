import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
import GeoMap from "@components/map/GeoMap";
import type { ContentHashCollection } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import * as L from "leaflet";
import React from "react";

import EditablePhotoEntry from "./EditablePhotoEntry";
import ImagePreview from "./imagePreview";
import ShowData from "./ShowData";
import SummariseExif from "./SummariseExif";
import SummariseMediaInfo from "./SummariseMediaInfo";
import SummariseNamedFiles from "./SummariseNamedFiles";

const imageSizeFromMediaInfo = (
  mediaInfo: MediainfoFromHash,
): { width: number; height: number } | undefined => {
  const videoTrack = mediaInfo.mediainfoData.media?.track.find(
    (t) => t["@type"] === "Video",
  );
  if (!videoTrack) return;

  const t = videoTrack as typeof videoTrack & {
    Width?: string;
    Height?: string;
  };
  if (!t.Width || !t.Height) return;

  return {
    width: Number(t.Width),
    height: Number(t.Height),
  };
};

export const ShowContentHashResult = ({
  contentHash,
  latestValue,
}: {
  contentHash: string;
  latestValue: ContentHashCollection;
}) => {
  const widthAndHeight = latestValue.exif
    ? latestValue.exif.exifData.imageSize
    : latestValue.mediaInfo
      ? imageSizeFromMediaInfo(latestValue.mediaInfo)
      : undefined;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ImagePreview
          namedFile={latestValue.namedFiles[0]}
          photo={latestValue.photo ?? {}}
          fullWidthAndHeight={widthAndHeight}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {latestValue.exif && <SummariseExif exif={latestValue.exif} />}
          {latestValue.mediaInfo && (
            <SummariseMediaInfo mediaInfo={latestValue.mediaInfo} />
          )}
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
                            latestValue.gps.asLatLng().lat,
                            latestValue.gps.asLatLng().lng,
                          ),
                          highlighted: false,
                        },
                      ],
                    ])
                  }
                />
              </div>
              <p className="gps">
                <a href={latestValue.gps.googleMapsUrl({ zoom: 15 })}>
                  Google Maps
                </a>
                {" | "}
                <a href={latestValue.gps.geoHackUrl({ title: "no title" })}>
                  GeoHack
                </a>
              </p>
            </>
          ) : (
            <p className="no-gps">[no GPS information]</p>
          )}
        </div>
      </div>

      <div style={{ marginBlock: "1em" }}>
        <EditablePhotoEntry
          contentHash={contentHash}
          photoDbEntry={latestValue.photo ?? {}}
        />
      </div>

      <SummariseNamedFiles namedFiles={latestValue.namedFiles} />

      <ShowData data={latestValue} />
    </>
  );
};
