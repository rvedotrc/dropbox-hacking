import React, { useEffect, useMemo, useRef, useState } from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
// import type {} from "@blaahaj/dropbox-hacking-mediainfo-db";
import SamePageLink from "../../samePageLink";
import EditableTextField from "../../day/editableTextField";
import useVisibilityTracking from "../../days/useVisibilityTracking";
import PhotoTile from "../../day/photoTile";
import type { Photo } from "dropbox-hacking-photo-manager-shared";

// const ImageFileDetails = ({ file }: { file: DayFilesImageFile }) => {
//   const exifTags = file.exifFromHash!.exifData.tags;
//   const imageSize = file.exifFromHash?.exifData.imageSize;

//   return (
//     <>
//       <td>{imageSize ? `${imageSize.width} x ${imageSize.height}` : "?"}</td>
//       <td>
//         <span>{exifTags?.Make}</span> <span>mo={exifTags?.Model}</span>
//       </td>
//       <td>
//         <span>{exifTags?.LensModel}</span>
//       </td>
//       <td>
//         <span>fl={exifTags?.FocalLength}</span>
//       </td>
//       <td>
//         <span>f={exifTags?.FNumber}</span>
//       </td>
//       <td>
//         <span>
//           t=
//           {exifTags?.ExposureTime
//             ? exifTags.ExposureTime < 1
//               ? `1/${Math.round(1 / exifTags.ExposureTime)}`
//               : exifTags.ExposureTime
//             : undefined}
//         </span>
//       </td>
//     </>
//   );
// };

// const RecordedLocation = ({ data }: { data: string | null | undefined }) => {
//   if (!data) return "-";

//   const m0 = data.match(/^([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/$/);
//   if (m0) {
//     const lat = Number(m0[1]);
//     const long = Number(m0[2]);
//     const alt = Number(m0[3]);

//     return `${lat}N ${long}E ${alt}m`;
//   }

//   const m1 = data.match(
//     /^([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/ \/ ([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/$/,
//   );
//   if (m1) {
//     const lat0 = Number(m1[1]);
//     const long0 = Number(m1[2]);
//     const alt0 = Number(m1[3]);

//     const lat1 = Number(m1[4]);
//     const long1 = Number(m1[5]);
//     const alt1 = Number(m1[6]);

//     return `${lat0}N ${long0}E ${alt0}m / ${lat1}N ${long1}E ${alt1}m`;
//   }

//   return `? ${data}`;
// };

// const VideoFileDetails = ({ file }: { file: DayFilesVideoFile }) => {
//   const mid = file.mediaInfoFromHash?.mediainfoData;
//   if (!mid) return "no mediainfo";

//   const media = mid.media;
//   if (!media) return "no media";

//   const tracks = media.track;
//   const general = tracks.find(
//     (t): t is GeneralTrack & Record<string, string> => t["@type"] === "General",
//   );
//   const video = tracks.find(
//     (t): t is VideoTrack & Record<string, string> => t["@type"] === "Video",
//   );

//   return (
//     <>
//       <td>{`${video?.Width ?? "?"} x ${video?.Height ?? "?"}`}</td>
//       <td>{`${general ? general.Encoded_Hardware_String : "?"}`}</td>
//       <td>
//         {`${general ? general.Format_String : "?"}`}{" "}
//         {`${general ? general.Format_Profile : "?"}`}
//       </td>
//       <td>{`${video?.Format_String ?? "?"}`}</td>
//       <td>{`${general ? general.Duration_String : "?"}`}</td>
//       <td>{`${general ? general.FrameRate_String : "?"}`}</td>
//       <td>
//         <RecordedLocation data={general?.Recorded_Location} />
//       </td>
//       <td>
//         <pre style={{ display: "none" }}>{JSON.stringify(tracks, null, 2)}</pre>
//       </td>
//     </>
//   );
// };

const FileRow = ({ file }: { file: DayFilesResult["files"][number] }) => (
  <tr key={file.namedFile.id}>
    <td>
      <SamePageLink
        state={{
          route: "route/next-gen/file/id",
          id: file.namedFile.id,
        }}
      >
        id
      </SamePageLink>
    </td>
    <td>
      <SamePageLink
        state={{
          route: "route/next-gen/file/rev",
          rev: file.namedFile.rev,
        }}
      >
        rev
      </SamePageLink>
    </td>
    <td>
      <SamePageLink
        state={{
          route: "route/next-gen/content-hash",
          contentHash: file.namedFile.content_hash,
        }}
      >
        hash
      </SamePageLink>
    </td>
    <td>{file.namedFile.client_modified}</td>
    <td>{file.namedFile.size}</td>
    <td>
      {file.content.exif && "+exif"}
      {file.content.mediaInfo && "+mediainfo"}
    </td>
    <td>{file.namedFile.name}</td>
  </tr>
);

const NGDayFiles = ({ date }: { date: string }) => {
  const [visibleRevs, setVisibleRevs] = useState<Set<string>>(new Set());

  const parentRef = useRef<HTMLDivElement>(null);
  console.log({ parent: parentRef.current });

  const latestValue = useLatestValueFromServerFeed<DayFilesResult>({
    type: "rx.ng.day.files",
    date,
  });

  useVisibilityTracking({
    parentRef,
    listItemDataAttribute: "data-rev",
    onVisibleItems: setVisibleRevs,
    deps: [latestValue, parentRef.current],
  });

  const dayMetadata = latestValue?.dayMetadata;

  const onSaveDescription = useMemo(
    () => (newText: string) =>
      fetch(`/api/day/${date}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: newText }),
      }).then(() => {}),
    [date],
  );

  useEffect(() => {
    document.title = `DPM NG - ${date}`;
  });

  return (
    <>
      <Navigate />

      <h1>{date}</h1>

      {latestValue ? (
        <>
          <p>
            <EditableTextField
              key={dayMetadata?.description ?? ""}
              value={dayMetadata?.description ?? ""}
              onSave={onSaveDescription}
            />
          </p>

          <p>{latestValue.files.length} files</p>

          <div ref={parentRef} className={"photoList"}>
            {latestValue.files
              // .filter((f) => f.content.exif)
              .toSorted((a, b) =>
                a.namedFile.client_modified.localeCompare(
                  b.namedFile.client_modified,
                ),
              )
              .map((photo) => {
                if (photo.exif) {
                  return (
                    <PhotoTile
                      key={photo.namedFile.rev}
                      photo={photo as Photo}
                      isVisible={visibleRevs.has(photo.namedFile.rev)}
                    />
                  );
                }

                return (
                  <div key={photo.namedFile.rev} className={"photoItem"}>
                    {photo.namedFile.name.split(".").pop()}
                    <br />
                    <SamePageLink
                      state={{
                        route: "route/next-gen/file/rev",
                        rev: photo.namedFile.rev,
                      }}
                    >
                      {photo.namedFile.rev}
                    </SamePageLink>
                  </div>
                );
              })}
          </div>

          <table>
            <tbody>
              {latestValue.files.map((f) => (
                <FileRow key={f.namedFile.id} file={f} />
              ))}
            </tbody>
          </table>
        </>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(NGDayFiles);
