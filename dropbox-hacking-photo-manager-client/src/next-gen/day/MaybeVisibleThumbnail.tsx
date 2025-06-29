import { useThumbnailLoader } from "../../context/thumbnails";
import logRender from "../../logRender";
import { useThumbnail } from "../../context/thumbnails/useThumbnail";
import React from "react";

const MaybeVisibleThumbnail = ({
  rev,
  visible,
}: {
  rev: string;
  visible: boolean;
}) => {
  const loader = useThumbnailLoader();

  const thumbnail = useThumbnail(rev, loader)(visible);

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

export default logRender(MaybeVisibleThumbnail);
