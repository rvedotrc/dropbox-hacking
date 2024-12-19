import type { Photo } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useState } from "react";
import { useThumbnailLoader } from ".";

export const useThumbnail = (
  photo: Photo,
  isVisible: boolean,
): string | null => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const loader = useThumbnailLoader();

  useEffect(() => {
    if (!loader) return;

    if (isVisible) {
      loader.getThumbnail(photo.rev).then(setThumbnail);
    } else setThumbnail(null);
  }, [loader, photo.rev, isVisible]);

  return thumbnail;
};
