import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
import type { ContentHashResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
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
  latestValue: ContentHashResult;
}) => {
  const widthAndHeight = latestValue.exif
    ? latestValue.exif.exifData.imageSize
    : latestValue.mediainfo
      ? imageSizeFromMediaInfo(latestValue.mediainfo)
      : undefined;

  const gps =
    (latestValue.exif ? GPSLatLong.fromExif(latestValue.exif) : null) ??
    (latestValue.mediainfo
      ? GPSLatLong.fromMediaInfo(latestValue.mediainfo)
      : null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ImagePreview
          namedFile={latestValue.namedFiles[0]}
          fullWidthAndHeight={widthAndHeight}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {latestValue.exif && <SummariseExif exif={latestValue.exif} />}
          {latestValue.mediainfo && (
            <SummariseMediaInfo mediaInfo={latestValue.mediainfo} />
          )}
          {gps ? (
            <p className="gps">
              <a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a>
              {" | "}
              <a href={gps.geoHackUrl({ title: "no title" })}>GeoHack</a>
            </p>
          ) : (
            <p className="no-gps">[no GPS information]</p>
          )}
        </div>
      </div>

      <div style={{ marginBlock: "1em" }}>
        <EditablePhotoEntry
          contentHash={contentHash}
          photoDbEntry={latestValue.photoDbEntry}
        />
      </div>

      <SummariseNamedFiles namedFiles={latestValue.namedFiles} />

      <ShowData data={latestValue} />
    </>
  );
};
