import {
  isAudioTrack,
  isGeneralTrack,
  isVideoTrack,
  type MediainfoFromHash,
  type VideoTrack,
} from "@blaahaj/dropbox-hacking-mediainfo-db/types";
import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import React from "react";

import SummaryTable from "./SummaryTable";

const resolutionName = (videoTrack: VideoTrack) => {
  if (Number(videoTrack.Width) === 1920 && Number(videoTrack.Height) === 1080)
    return "HD";
  if (Number(videoTrack.Width) === 3840 && Number(videoTrack.Height) === 2160)
    return "4K";
  return;
};

// Quicktime "mebx": https://developer.apple.com/documentation/quicktime-file-format/timed_metadata_sample_descriptions

const SummariseMediaInfo = ({
  mediaInfo,
}: {
  mediaInfo: MediainfoFromHash;
}) => {
  useStyleSheet({
    cssText: `

.mediaInfoGrid {
    display: grid;
    grid-auto-flow: column;
    width: fit-content;
}

.mediaInfoGrid > div {
    border-radius: 0.4em;
    margin: 0.1em;
    padding: 0.2em;
    padding-inline: 0.6em;
    text-align: left;
    text-wrap: none;
}

.mediaInfoGrid > div.k1 {
    grid-column: 1;
    background: purple;
    color: white;
}

.mediaInfoGrid > div.k2 {
    grid-column: 2;
    background: green;
    color: white;
}

.mediaInfoGrid > div.v {
    grid-column: 3;
    background: blue;
    color: white;
}

.mediaInfoGrid .mig-c {
    grid-row-start: 1;
    grid-row-end: 4;
}

.mediaInfoGrid .mig-v {
    grid-row-start: 4;
    grid-row-end: 8;
}

.mediaInfoGrid .mig-a {
    grid-row-start: 8;
    grid-row-end: 12;
}

.resolutionName {
    background: white;
    color: blue;
    padding: 0.15em 0.3em 0em;
    border-radius: 0.2em;
    margin-inline: 0.5em;
    font-size: 80%;
    font-weight: bold;
}
    `,
  });

  const tracks = mediaInfo.mediainfoData.media?.track ?? [];
  const generalTrack = tracks.find(isGeneralTrack);
  const videoTrack = tracks.find(isVideoTrack);
  const audioTrack = tracks.find(isAudioTrack);

  return (
    <SummaryTable
      table={{
        sections: [
          {
            name: "General",
            rows: [
              { key: "Format", value: generalTrack?.Format ?? "-" },
              { key: "Duration", value: generalTrack?.Duration ?? "-" },
              { key: "File size", value: generalTrack?.FileSize ?? "-" },
            ],
          },
          {
            name: "Video",
            rows: [
              { key: "Format", value: videoTrack?.Format ?? "-" },
              {
                key: "Resolution",
                value:
                  videoTrack?.Width && videoTrack?.Height ? (
                    <>
                      {videoTrack.Width}
                      {" x "}
                      {videoTrack.Height}
                      {resolutionName(videoTrack) && (
                        <span className="resolutionName">
                          {resolutionName(videoTrack)}
                        </span>
                      )}
                    </>
                  ) : (
                    "-"
                  ),
              },
              {
                key: "Aspect ratio",
                value: videoTrack?.DisplayAspectRatio_String ?? "-",
              },
              {
                key: "fps",
                value: videoTrack?.FrameRate
                  ? Math.round(Number(videoTrack.FrameRate))
                  : "-",
              },
            ],
          },
          {
            name: "Audio",
            rows: [
              { key: "Format", value: audioTrack?.Format ?? "-" },
              { key: "Sampling rate", value: audioTrack?.SamplingRate ?? "-" },
              { key: "Channels", value: audioTrack?.Channels ?? "-" },
              { key: "Bitrate", value: audioTrack?.BitRate ?? "-" },
            ],
          },
        ],
      }}
    />
  );
};

export default logRender(SummariseMediaInfo);
