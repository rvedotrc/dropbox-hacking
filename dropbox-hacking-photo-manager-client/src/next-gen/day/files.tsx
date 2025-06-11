import React from "react";

import logRender from "../../logRender";
import Navigate from "../../days/navigate";
import type {
  DayFilesImageFile,
  DayFilesResult,
  DayFilesVideoFile,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import type {
  GeneralTrack,
  VideoTrack,
} from "../../../../../../blaahaj/dropbox-hacking-mediainfo-db/dist/src/types";
import SamePageLink from "../../samePageLink";

const ImageFileDetails = ({ file }: { file: DayFilesImageFile }) => {
  const exifTags = file.exifFromHash!.exifData.tags;
  const imageSize = file.exifFromHash?.exifData.imageSize;

  return (
    <>
      <td>{imageSize ? `${imageSize.width} x ${imageSize.height}` : "?"}</td>
      <td>
        <span>{exifTags?.Make}</span> <span>mo={exifTags?.Model}</span>
      </td>
      <td>
        <span>{exifTags?.LensModel}</span>
      </td>
      <td>
        <span>fl={exifTags?.FocalLength}</span>
      </td>
      <td>
        <span>f={exifTags?.FNumber}</span>
      </td>
      <td>
        <span>
          t=
          {exifTags?.ExposureTime
            ? exifTags.ExposureTime < 1
              ? `1/${Math.round(1 / exifTags.ExposureTime)}`
              : exifTags.ExposureTime
            : undefined}
        </span>
      </td>
    </>
  );
};

const RecordedLocation = ({ data }: { data: string | null | undefined }) => {
  if (!data) return "-";

  const m0 = data.match(/^([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/$/);
  if (m0) {
    const lat = Number(m0[1]);
    const long = Number(m0[2]);
    const alt = Number(m0[3]);

    return `${lat}N ${long}E ${alt}m`;
  }

  const m1 = data.match(
    /^([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/ \/ ([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/$/,
  );
  if (m1) {
    const lat0 = Number(m1[1]);
    const long0 = Number(m1[2]);
    const alt0 = Number(m1[3]);

    const lat1 = Number(m1[4]);
    const long1 = Number(m1[5]);
    const alt1 = Number(m1[6]);

    return `${lat0}N ${long0}E ${alt0}m / ${lat1}N ${long1}E ${alt1}m`;
  }

  return `? ${data}`;
};

const VideoFileDetails = ({ file }: { file: DayFilesVideoFile }) => {
  const mid = file.mediaInfoFromHash?.mediainfoData;
  if (!mid) return "no mediainfo";

  const media = mid.media;
  if (!media) return "no media";

  const tracks = media.track;
  const general = tracks.find(
    (t): t is GeneralTrack & Record<string, string> => t["@type"] === "General",
  );
  const video = tracks.find(
    (t): t is VideoTrack & Record<string, string> => t["@type"] === "Video",
  );

  return (
    <>
      <td>{`${video?.Width ?? "?"} x ${video?.Height ?? "?"}`}</td>
      <td>{`${general ? general.Encoded_Hardware_String : "?"}`}</td>
      <td>
        {`${general ? general.Format_String : "?"}`}{" "}
        {`${general ? general.Format_Profile : "?"}`}
      </td>
      <td>{`${video?.Format_String ?? "?"}`}</td>
      <td>{`${general ? general.Duration_String : "?"}`}</td>
      <td>{`${general ? general.FrameRate_String : "?"}`}</td>
      <td>
        <RecordedLocation data={general?.Recorded_Location} />
      </td>
      <td>
        <pre style={{ display: "none" }}>{JSON.stringify(tracks, null, 2)}</pre>
      </td>
    </>
  );
};

const FileRow = ({ file }: { file: DayFilesResult["files"][number] }) => (
  <tr key={file.namedFile.id}>
    <td>{file.type}</td>
    <td>
      <SamePageLink
        state={{
          route: "next-gen/file/id",
          id: file.namedFile.id,
        }}
      >
        id
      </SamePageLink>
    </td>
    <td>
      <SamePageLink
        state={{
          route: "next-gen/file/rev",
          rev: file.namedFile.rev,
        }}
      >
        rev
      </SamePageLink>
    </td>
    <td>
      <SamePageLink
        state={{
          route: "next-gen/content-hash",
          contentHash: file.namedFile.content_hash,
        }}
      >
        hash
      </SamePageLink>
    </td>
    <td>{file.namedFile.client_modified}</td>
    <td>{file.namedFile.size}</td>
    {file.type === "image" && file.exifFromHash && (
      <ImageFileDetails file={file} />
    )}
    {file.type === "video" && file.mediaInfoFromHash && (
      <VideoFileDetails file={file} />
    )}
  </tr>
);

const NGDayFiles = ({ date }: { date: string }) => {
  const latestValue = useLatestValueFromServerFeed<DayFilesResult>({
    type: "ng.day.files",
    date,
  });

  return (
    <>
      <Navigate />

      <h1>Files on {date}</h1>

      <pre>{JSON.stringify(latestValue?.dayMetadata, null, 2)}</pre>

      {latestValue ? (
        <table>
          <tbody>
            {latestValue.files.map((f) => (
              <FileRow key={f.namedFile.id} file={f} />
            ))}
          </tbody>
        </table>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(NGDayFiles);
