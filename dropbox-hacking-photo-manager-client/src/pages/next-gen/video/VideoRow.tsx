import SamePageLink from "@components/samePageLink";
import type { VideoResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React from "react";

// import MaybeVisibleThumbnail from "../day/MaybeVisibleThumbnail";
import Tags from "../day/Tags";

export const VideoRow = ({ item }: { item: VideoResult[number] }) => {
  const { general, video, audio } = item.mediaInfoSummary;

  return (
    <tr key={item.namedFile.rev} data-rev={item.namedFile.rev}>
      <td>{item.namedFile.client_modified.substring(0, 10)}</td>
      <td className="dayDescription">{item.day?.description ?? ""}</td>

      <td className="photoDescription">
        {item.photoDbEntry?.description ?? ""}
      </td>
      <td className="photoTags">
        <Tags tags={item.photoDbEntry?.tags ?? []} />
      </td>

      <td>{general?.gps ? "GPS" : "–"}</td>

      <td title={item.namedFile.name.replace(item.namedFile.content_hash, "#")}>
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: item.namedFile.content_hash,
          }}
        >
          view
        </SamePageLink>
      </td>

      <td className="duration">{general?.duration?.toFixed(0) ?? "–"}</td>

      <td>{general?.format ?? "–"}</td>
      <td>{general?.codec ?? "–"}</td>

      <td>{video?.format ?? "–"}</td>
      <td>{video?.codec ?? "–"}</td>

      <td>
        {video?.widthAndHeight
          ? `${video?.widthAndHeight.width} x ${video?.widthAndHeight.height}`
          : "–"}
      </td>
      <td>{video?.aspectRatio.string ?? "–"}</td>

      <td>{audio?.format ?? "–"}</td>
      <td>{audio?.codec ?? "–"}</td>
      <td>{audio?.channels ?? "–"}</td>
      <td>{audio?.samplingRate ?? "–"}</td>
    </tr>
  );
};
