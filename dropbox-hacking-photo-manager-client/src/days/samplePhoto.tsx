import * as React from "react";
import { Photo } from "dropbox-hacking-photo-manager-shared";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import { useThumbnailLoader } from "../context/thumbnails";

const samplePhoto = ({
  photo,
  visible,
}: {
  photo: Photo;
  visible: boolean;
}) => {
  const loader = useThumbnailLoader();
  const thumbnail = useThumbnail(photo.rev, loader)(visible);

  return (
    <span
      key={photo.id}
      style={{
        display: "inline-block",
        height: "128px",
        width: "128px",
      }}
    >
      <img
        src={
          thumbnail ? `data:image/jpeg;base64,${thumbnail}` : `/placeholder.png`
        }
        alt={"thumbnail"}
      />
    </span>
  );
};

export default samplePhoto;
