import React, { useId, useState } from "react";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import logRender from "@/logRender";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";

const SummariseExif = ({ exif }: { exif: ExifFromHash }) => {
  const [expandFull, setExpandFull] = useState(false);
  const checkboxId = useId();

  const imageSize = exif.exifData.imageSize;
  const tags = exif.exifData.tags;
  const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

  // The most present (and not blank) tags as of 2025-06-27 are:
  // Make (97.1%)
  // Model
  // ExposureTime
  // FocalLength
  // FNumber
  // DateTimeOriginal
  // CreateDate
  // Flash
  // WhiteBalance
  // Orientation
  // ModifyDate
  // MeteringMode (95%)
  // ExifImageHeight
  // ExifImageWidth
  // XResolution
  // YResolution
  // ResolutionUnit
  // ColorSpace
  // YCbCrPositioning
  // SceneCaptureType
  // ExposureMode
  // ExposureProgram
  // ExposureCompensation (89.5%)
  // ISO
  // ApertureValue
  // InteropIndex
  // ShutterSpeedValue
  // and that takes us down to 80%.

  return (
    <>
      <p>
        Image size:{" "}
        {imageSize ? `${imageSize.width} x ${imageSize.height}` : "unknown"}
      </p>

      <p>Selected tags:</p>

      <ul>
        <li>Make: {tags?.Make ?? "-"}</li>
        <li>Model: {tags?.Model ?? "-"}</li>
        <li>ExposureTime: {tags?.ExposureTime ?? "-"}</li>
        <li>FocalLength: {tags?.FocalLength ?? "-"}</li>
        <li>FNumber: {tags?.FNumber ?? "-"}</li>
        <li>DateTimeOriginal: {tags?.DateTimeOriginal ?? "-"}</li>
        <li>Orientation: {tags?.Orientation ?? "-"}</li>
        <li>ISO: {tags?.ISO ?? "-"}</li>
      </ul>

      {gps && (
        <p>
          <a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a>
          {" | "}
          <a href={gps.geoHackUrl({ title: "no title" })}>GeoHack</a>
        </p>
      )}

      <p>
        <input
          id={checkboxId}
          type="checkbox"
          checked={expandFull}
          onChange={(e) => setExpandFull(e.currentTarget.checked)}
        />{" "}
        <label htmlFor={checkboxId}>Show full EXIF data</label>
      </p>

      {expandFull && <pre>{JSON.stringify(exif, null, 2)}</pre>}
    </>
  );
};

export default logRender(SummariseExif);
