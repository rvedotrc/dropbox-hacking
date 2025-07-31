import logRender from "@lib/logRender";
import type {
  NamedFile,
  PhotoDbEntry,
} from "dropbox-hacking-photo-manager-shared";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Normalise to [0, 360)
const mod360 = (n: number) => (n + 360 * Math.ceil(Math.abs(n) / 360)) % 360;

const ImagePreview = ({
  namedFile,
  photo,
}: {
  namedFile: NamedFile;
  photo: PhotoDbEntry;
}) => {
  const [previewWidthAndHeight, setPreviewWidthAndHeight] = useState<{
    width: number;
    height: number;
  }>();

  const theImage = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = theImage.current;
    if (!img) return;

    const readSize = (): boolean => {
      if (img.naturalWidth && img.naturalHeight) {
        setPreviewWidthAndHeight({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        return true;
      } else {
        return false;
      }
    };

    if (!readSize()) {
      const loadEvent = () => {
        if (readSize()) img.removeEventListener("load", loadEvent);
      };
      img.addEventListener("load", loadEvent);
    }
  }, []);

  const targetDegrees = photo.rotate ?? 0;

  const applyRotation = useMemo(
    () => (add: number) =>
      void fetch(`/api/photo/content_hash/${namedFile.content_hash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...photo,
          rotate: mod360(targetDegrees + add) || undefined,
        }),
      }),
    [namedFile.content_hash, photo],
  );

  const rotatedWidthAndHeight = previewWidthAndHeight
    ? (targetDegrees / 90) % 2
      ? {
          width: previewWidthAndHeight.height,
          height: previewWidthAndHeight.width,
        }
      : previewWidthAndHeight
    : undefined;

  return (
    <div>
      <div
        style={{
          width: `${rotatedWidthAndHeight?.width ?? 640}px`,
          height: `${rotatedWidthAndHeight?.height ?? 640}px`,
          marginInlineEnd: "2em",
          marginBlockEnd: "2em",
          position: "relative",
          transitionProperty: "width,height",
          transitionDuration: "0.3s",
        }}
      >
        <a href={`/image/rev/${namedFile.rev}`}>
          <img
            style={{
              transform:
                !previewWidthAndHeight || !rotatedWidthAndHeight
                  ? undefined
                  : `
                  translate(
                    ${(rotatedWidthAndHeight.width - previewWidthAndHeight.width) / 2}px,
                    ${(rotatedWidthAndHeight.height - previewWidthAndHeight.height) / 2}px
                    )
                  rotate(${targetDegrees}deg)
              `,
              // disabled because of 270-degree spin problem
              // (instead of 90 in the opposite direction)
              // transitionProperty: "transform",
              // transitionDuration: "0.3s",
              transformOrigin: "center",
            }}
            ref={theImage}
            src={`/image/rev/${namedFile.rev}/w640h480/bestfit/jpeg`}
            alt={"preview"}
          />
        </a>

        <button
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: "transparent",
            border: "none",
            fontSize: "20pt",
            transform: "rotate(-90deg)",
          }}
          onClick={(e) => void applyRotation(e.altKey ? -90 : +90)}
        >
          ⤵️
        </button>
      </div>
    </div>
  );
};

export default logRender(ImagePreview);
