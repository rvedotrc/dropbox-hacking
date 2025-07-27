import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import { analyseAspectRatio } from "dropbox-hacking-photo-manager-shared";
import React, { useMemo } from "react";

import SummaryTable from "./SummaryTable";

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

  const photographicParametersId = useMemo(
    () => "X_" + crypto.randomUUID().replaceAll(/-/g, "_"),
    [],
  );

  useStyleSheet({
    cssText: `
      #${photographicParametersId} {
        display: flex;
        flex-direction: row;
        padding-inline-start: 0;
      }

      #${photographicParametersId} > li {
        list-style: none;
        margin-right: 1em;
      }
    `,
  });

  const t = tags?.ExposureTime;

  return (
    <>
      <SummaryTable
        table={{
          sections: [
            {
              name: "General",
              rows: [
                {
                  key: "Size",
                  value: imageSize
                    ? `${imageSize.width} x ${imageSize.height}`
                    : "?",
                },
                {
                  key: "Aspect ratio",
                  value: imageSize
                    ? (analyseAspectRatio(imageSize.width, imageSize.height) ??
                      "?")
                    : "?",
                },
                {
                  key: "Taken",
                  value: tags?.DateTimeOriginal
                    ? new Date(tags.DateTimeOriginal * 1000).toISOString()
                    : "-",
                },
              ],
            },
            {
              name: "Photographic",
              rows: [
                {
                  key: "Exposure",
                  value: t ? (
                    <>
                      {t.toFixed(4)}s (1/{(1 / t).toFixed(4)}s)
                    </>
                  ) : (
                    "-"
                  ),
                },
                {
                  key: "Aperture",
                  value: tags?.FNumber ? `ƒ${tags.FNumber}` : "-",
                },
                {
                  key: "Focal length",
                  value: tags?.FocalLength ? `${tags?.FocalLength}m` : "-",
                },
                {
                  key: "Film speed",
                  value: tags?.ISO ? `ISO${tags.ISO}` : "-",
                },
              ],
            },
            {
              name: "Device",
              rows: [
                { key: "Make", value: tags?.Make ?? "-" },
                { key: "Model", value: tags?.Model ?? "-" },
                { key: "Orientation", value: tags?.Orientation ?? "-" },
              ],
            },
          ],
        }}
      />
    </>
  );
};

export default logRender(SummariseExif);
