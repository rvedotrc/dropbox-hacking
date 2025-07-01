import { useThumbnailLoader } from "@/context/thumbnails";
import logRender from "@/logRender";
import { useThumbnail } from "@/context/thumbnails/useThumbnail";
import React from "react";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";

const dropboxThumbnailableExtensions: readonly string[] = [
  "jpg",
  "jpeg,",
  "png",
  "tiff",
  "tif",
  "gif",
  "webp",
  "ppm",
  "bmp",
];

const MaybeVisibleThumbnail = ({
  namedFile,
  visible,
}: {
  namedFile: NamedFile;
  visible: boolean;
}) => {
  const loader = useThumbnailLoader();

  const ext = namedFile.path_lower.split(".").pop() as string;
  const isThumbnailable = dropboxThumbnailableExtensions.includes(ext);
  const thumbnail = useThumbnail(
    namedFile.rev,
    loader,
  )(isThumbnailable && visible);

  console.log([namedFile.name, ext, isThumbnailable, visible, !!thumbnail]);

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
