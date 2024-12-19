import * as React from "react";
import { Photo } from "dropbox-hacking-photo-manager-shared";
import SamePageLink from "../samePageLink";
import logRender from "../logRender";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import { useThumbnailLoader } from "../context/thumbnails";

const cleanedName = (photo: Photo) => {
  if (photo.content_hash) {
    return photo.name.replace(photo.content_hash, "#");
  }

  return photo.name;
};

const PhotoTile = ({
  photo,
  isVisible,
}: {
  photo: Photo;
  isVisible: boolean;
}) => {
  const loader = useThumbnailLoader();

  const thumbnail = useThumbnail(photo.rev, loader)(isVisible);

  return (
    <SamePageLink
      className={"photoItem"}
      key={photo.id}
      href={`/photo/rev/${photo.rev}`}
      state={{ route: "photo", rev: photo.rev }}
      data-rev={photo.rev}
    >
      <img
        src={
          thumbnail ? `data:image/jpeg;base64,${thumbnail}` : `/placeholder.png`
        }
        alt={"thumbnail"}
        style={{
          width: thumbnail ? undefined : "128px",
          height: thumbnail ? undefined : "128px",
        }}
      />
      <div className={"clientModified"}>{photo.client_modified}</div>
      <div className={"name"}>{cleanedName(photo)}</div>
      <div className={"makeAndModel"}>
        {photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}
      </div>
    </SamePageLink>
  );
};

export default logRender(PhotoTile);
