import useThumbnail from "@hooks/useThumbnail";
import logRender from "@lib/logRender";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";
import { isPreviewable } from "dropbox-hacking-photo-manager-shared/fileTypes";
import React from "react";

const MaybeVisibleThumbnail = ({
  namedFile,
  visible,
}: {
  namedFile: NamedFile;
  visible: boolean;
}) => {
  const isThumbnailable = isPreviewable(namedFile.path_lower);
  const thumbnail = useThumbnail(namedFile.rev)(isThumbnailable && visible);

  // console.log([namedFile.name, ext, isThumbnailable, visible, !!thumbnail]);

  return (
    <>
      <div style={{ minHeight: "128px" }}>
        <img
          src={
            thumbnail
              ? `data:image/jpeg;base64,${thumbnail}`
              : `/placeholder.png`
          }
          alt={"thumbnail"}
          style={{
            width: thumbnail ? undefined : "128px",
            height: thumbnail ? undefined : "128px",
          }}
        />
      </div>
    </>
  );
};

export default logRender(MaybeVisibleThumbnail, false);
