import SamePageLink from "@components/samePageLink";
import useThumbnail from "@hooks/useThumbnail";
import logRender from "@lib/logRender";
import type {
  NamedFile,
  PhotoDbEntry,
  RouteState,
} from "dropbox-hacking-photo-manager-shared";
import { isPreviewable } from "dropbox-hacking-photo-manager-shared/fileTypes";
import React, { useMemo } from "react";

const MaybeVisibleThumbnail = ({
  namedFile,
  photo,
  visible,
  routeState,
}: {
  namedFile: NamedFile;
  photo: PhotoDbEntry;
  visible: boolean;
  routeState: RouteState;
}) => {
  const isThumbnailable = isPreviewable(namedFile.path_lower);
  const thumbnail = useThumbnail(namedFile.rev)(isThumbnailable && visible);

  // console.log([namedFile.name, ext, isThumbnailable, visible, !!thumbnail]);

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
    <>
      <div style={{ position: "relative" }}>
        <SamePageLink routeState={routeState}>
          <div
            style={{
              minHeight: "128px",
              transform: degrees === 0 ? undefined : `rotate(${degrees}deg)`,
              transitionProperty: "transform",
              transitionDuration: "1s",
            }}
          >
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
        </SamePageLink>

        <button
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "transparent",
            border: "none",
            fontSize: "10pt",
          }}
          onClick={(e) => {
            e.preventDefault();
            void setRotation((degrees + (e.altKey ? 270 : 90)) % 360);
          }}
        >
          ⤵️
        </button>
      </div>
    </>
  );
};

export default logRender(MaybeVisibleThumbnail, false);
