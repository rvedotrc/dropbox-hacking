import logRender from "@lib/logRender";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";
import React from "react";

const ImagePreview = ({
  namedFile,
  fullWidthAndHeight,
}: {
  namedFile: NamedFile;
  fullWidthAndHeight?: { width: number; height: number };
}) => {
  const boxRatio = 640 / 480;
  const fullRatio = fullWidthAndHeight
    ? fullWidthAndHeight.width / fullWidthAndHeight.height
    : boxRatio;

  return (
    <div
      style={{
        width: "640px",
        // minWidth: fullRatio >= boxRatio ? "640px" : undefined,
        minHeight: fullRatio <= boxRatio ? "480px" : undefined,
        marginInlineEnd: "2em",
        marginBlockEnd: "2em",
        textAlign: "center",
      }}
    >
      <a href={`/image/rev/${namedFile.rev}`}>
        <img src={`/image/rev/${namedFile.rev}/w640h480`} alt={"preview"} />
      </a>
    </div>
  );
};

export default logRender(ImagePreview);
