import { Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import useThumbnail from "@hooks/useThumbnail";
import logRender from "@lib/logRender";

const samplePhoto = ({
  photo,
  visible,
}: {
  photo: Photo;
  visible: boolean;
}): React.ReactElement | null => {
  const thumbnail = useThumbnail(photo.namedFile.rev)(visible);

  return (
    <span key={photo.namedFile.id} className="sample">
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
