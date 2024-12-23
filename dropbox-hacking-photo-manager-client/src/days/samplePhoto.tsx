import * as React from "react";
import { Photo } from "dropbox-hacking-photo-manager-shared";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import { useThumbnailLoader } from "../context/thumbnails";
import logRender from "../logRender";

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
    <span key={photo.id} className="sample">
      <img
        src={
          thumbnail ? `data:image/jpeg;base64,${thumbnail}` : `/placeholder.png`
        }
        alt={"thumbnail"}
      />
    </span>
  );
};

export default logRender(samplePhoto);
