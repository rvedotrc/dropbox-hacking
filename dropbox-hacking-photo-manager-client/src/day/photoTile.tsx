import { Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import { useThumbnailLoader } from "../context/thumbnails";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import logRender from "../logRender";
import SamePageLink from "../samePageLink";

const cleanedName = (photo: Photo) => {
  if (photo.file.content_hash) {
    return photo.file.name.replace(photo.file.content_hash, "#");
  }

  return photo.file.name;
};

const PhotoTile = ({
  photo,
  isVisible,
}: {
  photo: Photo;
  isVisible: boolean;
}): React.ReactElement | null => {
  const loader = useThumbnailLoader();

  const thumbnail = useThumbnail(photo.file.rev, loader)(isVisible);

  return (
    <SamePageLink
      className={"photoItem"}
      key={photo.file.id}
      href={`/photo/rev/${photo.file.rev}`}
      state={{ route: "photo", rev: photo.file.rev }}
      data-rev={photo.file.rev}
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
      <div className={"clientModified"}>{photo.file.client_modified}</div>
      <div className={"name"}>{cleanedName(photo)}</div>
      <div className={"makeAndModel"}>
        {photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}
      </div>
    </SamePageLink>
  );
};

export default logRender(PhotoTile);
