import React, { useEffect, useId, useState } from "react";
import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
import logRender from "@lib/logRender";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";

// e.g. "+56.1278+012.3032+000.090/",
const RecordedLocation = ({ location }: { location: string }) => {
  const gps = GPSLatLong.fromMediaInfoRecordedAt(location);
  if (!gps) return;

  return (
    <p>
      <a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a>
      {" | "}
      <a href={gps.geoHackUrl({ title: "no title" })}>GeoHack</a>
    </p>
  );
};

const resolutionName = (videoTrack: { Width: number; Height: number }) => {
  if (videoTrack.Width == 1920 && videoTrack.Height == 1080) return "HD";
  if (videoTrack.Width == 3840 && videoTrack.Height == 2160) return "4K";
  return;
};

// const WidthAndHeight = ({ w, h }: { w?: number; h?: number }) => {
//   if (!w || !h) return;

//   return (
//     <>
//       {w}x{h}
//       {w == 1920 && h == 1080 && (
//         <span
//           style={{
//             background: "darkgreen",
//             color: "white",
//             padding: "0.35em 0.3em 0.2em",
//             borderRadius: "0.2em",
//             marginInline: "0.5em",
//             fontFamily: "sans-serif",
//             fontSize: "80%",
//           }}
//         >
//           HD
//         </span>
//       )}
//       {w == 3840 && h == 2160 && (
//         <span
//           style={{
//             background: "darkpurple",
//             color: "white",
//             padding: "0.35em 0.3em 0.2em",
//             borderRadius: "0.2em",
//             marginInline: "0.5em",
//             fontFamily: "sans-serif",
//             fontSize: "80%",
//           }}
//         >
//           4K
//         </span>
//       )}
//     </>
//   );
// };

// Quicktime "mebx": https://developer.apple.com/documentation/quicktime-file-format/timed_metadata_sample_descriptions

const SummariseMediaInfo = ({
  mediaInfo,
}: {
  mediaInfo: MediainfoFromHash;
}) => {
  const css = `

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
    `;

  useEffect(() => {
    const head = document.getElementsByTagName("head")[0];
    if (!head) return;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    style.setAttribute("type", "text/css");
    head.appendChild(style);

    return () => void head.removeChild(style);
  }, []);

  const [expandFull, setExpandFull] = useState(false);
  const checkboxId = useId();

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

      {generalTrack.Recorded_Location && (
        <RecordedLocation location={generalTrack.Recorded_Location} />
      )}

      <p>
        <input
          id={checkboxId}
          type="checkbox"
          checked={expandFull}
          onChange={(e) => setExpandFull(e.currentTarget.checked)}
        />{" "}
        <label htmlFor={checkboxId}>Show full mediainfo</label>
      </p>

      {expandFull && <pre>{JSON.stringify(mediaInfo, null, 2)}</pre>}
    </>
  );
};

export default logRender(SummariseMediaInfo);
