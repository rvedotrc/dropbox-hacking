import * as React from "react";
import { Photo } from "dropbox-hacking-photo-manager-shared";
import { useThumbnailLoader } from "./thumbnailLoaderContext";

const samplePhoto = ({ photo }: { photo: Photo }) => {
  const loader = useThumbnailLoader();
  const thumbnail = loader?.getThumbnail(photo.rev);

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
