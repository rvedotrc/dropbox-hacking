import logRender from "@lib/logRender";
import type {
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import React, { useMemo } from "react";

const ImagePreview = ({
  namedFile,
  photo,
}: {
  namedFile: NamedFile;
  photo: PhotoDbEntry;
  fullWidthAndHeight?: { width: number; height: number };
}) => {
  // const boxRatio = 640 / 640;
  // const fullRatio = fullWidthAndHeight
  //   ? fullWidthAndHeight.width / fullWidthAndHeight.height
  //   : boxRatio;

  const degrees = photo.rotate ?? 0;

  const setRotation = useMemo(
    () => (newDegrees: number) =>
      fetch(`/api/photo/content_hash/${namedFile.content_hash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...photo,
          rotate: newDegrees || undefined,
        }),
      }).then(() => {}),
    [namedFile.content_hash, photo],
  );

  return (
    <div
      style={{
        width: "640px",
        height: "640px",
        position: "relative",
        marginInlineEnd: "2em",
        marginBlockEnd: "2em",
      }}
    >
      <div
        style={{
          transformOrigin: "center",
          transform: degrees === 0 ? undefined : `rotate(${degrees}deg)`,
          transitionProperty: "transform",
          transitionDuration: "0.3s",
          position: "relative",
        }}
      >
        <a href={`/image/rev/${namedFile.rev}`}>
          <img src={`/image/rev/${namedFile.rev}/w640h480`} alt={"preview"} />
        </a>
      </div>

      <button
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          background: "transparent",
          border: "none",
          fontSize: "20pt",
        }}
        onClick={(e) =>
          void setRotation((degrees + (e.altKey ? 270 : 90)) % 360)
        }
      >
        ⤵️
      </button>
    </div>
  );
};

export default logRender(ImagePreview);
