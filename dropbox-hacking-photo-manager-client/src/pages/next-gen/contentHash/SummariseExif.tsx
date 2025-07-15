import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import logRender from "@lib/logRender";
import React from "react";

const SummariseExif = ({ exif }: { exif: ExifFromHash }) => {
  const imageSize = exif.exifData.imageSize;
  const tags = exif.exifData.tags;

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
    </>
  );
};

export default logRender(SummariseExif);
