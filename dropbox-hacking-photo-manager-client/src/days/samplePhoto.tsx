import { Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import { useThumbnailLoader } from "../context/thumbnails";
import { useThumbnail } from "../context/thumbnails/useThumbnail";
import logRender from "../logRender";

const samplePhoto = ({
  photo,
  visible,
}: {
  photo: Photo;
  visible: boolean;
}): React.ReactElement | null => {
  const loader = useThumbnailLoader();
  const thumbnail = useThumbnail(photo.file.rev, loader)(visible);

  return (
    <span key={photo.file.id} className="sample">
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
