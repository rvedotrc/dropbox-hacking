import { GPSLatLong, Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import { useThumbnailLoader } from "../context/thumbnails";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import logRender from "../logRender";
import SamePageLink from "../samePageLink";

const cleanedName = (photo: Photo) => {
  if (photo.namedFile.content_hash) {
    return photo.namedFile.name.replace(photo.namedFile.content_hash, "#");
  }

  return photo.namedFile.name;
};

const PhotoTile = ({
  photo,
  isVisible,
}: {
  photo: Photo;
  isVisible: boolean;
}): React.ReactElement | null => {
  const loader = useThumbnailLoader();

  const thumbnail = useThumbnail(photo.namedFile.rev, loader)(isVisible);

  const tags = photo.exif.exifData.tags;
  const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

  const model = photo.exif.exifData.tags?.Model ?? "";
  const deviceIcon = /EX-Z3|FinePix HS10 HS11|Canon PowerShot SX70 HS/.test(
    model,
  )
    ? "/camera-icon.svg"
    : /iPhone 4S|Pixel|Pixel 2|iPhone 12 mini/.test(model)
      ? "/mobile-phone.svg"
      : null;

  return (
    <SamePageLink
      className={"photoItem"}
      key={photo.namedFile.id}
      state={{ route: "photo", rev: photo.namedFile.rev }}
      data-rev={photo.namedFile.rev}
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
      <div className={"clientModified"}>{photo.namedFile.client_modified}</div>
      <div className={"name"}>{cleanedName(photo)}</div>
      <div className={"makeAndModel"}>
        {photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}
      </div>
      {gps && (
        <img src="/gps-pin.svg" style={{ width: "1em", height: "2em" }} />
      )}

      {deviceIcon && (
        <img src={deviceIcon} style={{ width: "2em", height: "2em" }} />
      )}
    </SamePageLink>
  );
};

export default logRender(PhotoTile);
