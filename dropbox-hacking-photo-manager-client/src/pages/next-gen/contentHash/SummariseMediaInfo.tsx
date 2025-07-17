import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import React from "react";

const resolutionName = (videoTrack: { Width: number; Height: number }) => {
  if (videoTrack.Width == 1920 && videoTrack.Height == 1080) return "HD";
  if (videoTrack.Width == 3840 && videoTrack.Height == 2160) return "4K";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generalTrack = tracks.find((t) => t["@type"] === "General") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoTrack = tracks.find((t) => t["@type"] === "Video") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioTrack = tracks.find((t) => t["@type"] === "Audio") as any;

  return (
    <>
      <div className="mediaInfoGrid">
        <div className="mig-c k1">General</div>
        <div className="mig-c-f k2">Format</div>
        <div className="mig-c-f v">{generalTrack?.Format_String ?? "-"}</div>
        <div className="mig-c-d k2">Duration</div>
        <div className="mig-c-d v">{generalTrack?.Duration_String ?? "-"}</div>
        <div className="mig-c-s k2">File size</div>
        <div className="mig-c-s v">{generalTrack?.FileSize_String4 ?? "-"}</div>

        <div className="mig-v k1">Video</div>
        <div className="mig-v-f k2">Format</div>
        <div className="mig-v-f v">{videoTrack?.Format_String ?? "-"}</div>
        <div className="mig-v-res k2">Resolution</div>
        <div className="mig-v-res v">
          {videoTrack.Width && videoTrack.Height ? (
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
          )}
        </div>
        <div className="mig-v-ar k2">Aspect ratio</div>
        <div className="mig-v-ar v">
          {videoTrack?.DisplayAspectRatio_String ?? "-"}
        </div>
        <div className="mig-v-fps k2">fps</div>
        <div className="mig-v-fps v">
          {videoTrack?.FrameRate
            ? Math.round(Number(videoTrack.FrameRate))
            : "-"}
        </div>

        <div className="mig-a k1">Audio</div>
        <div className="mig-a-f k2">Format</div>
        <div className="mig-a-f v">{audioTrack?.Format_String ?? "-"}</div>
        <div className="mig-a-sr k2">Sampling rate</div>
        <div className="mig-a-sr v">
          {audioTrack?.SamplingRate_String ?? "-"}
        </div>
        <div className="mig-a-ch k2">Channels</div>
        <div className="mig-a-ch v">{audioTrack?.Channels ?? "-"}</div>
        <div className="mig-a-br k2">Bitrate</div>
        <div className="mig-a-br v">{audioTrack?.BitRate_String ?? "-"}</div>
      </div>
    </>
  );
};

export default logRender(SummariseMediaInfo);
