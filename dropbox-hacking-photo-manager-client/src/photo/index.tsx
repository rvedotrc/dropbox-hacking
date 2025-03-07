import { GPSLatLong, Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useState } from "react";

import logRender from "../logRender";
import { useLatestValue } from "../context/rx/useLatestValue";
import { useAdditionalFeeds } from "../context/rx/additionalFeeds";

const Photo = (props: { rev: string }): React.ReactElement | null => {
  const [previewSizes, setPreviewSizes] = useState<string[]>();

  const p2 = useLatestValue(useAdditionalFeeds()?.filesAndExifAndPhotoDb);
  const photo = p2
    ? Object.values(p2).find((p) => p.namedFile.rev === props.rev)
    : undefined;

  useEffect(() => {
    document.title = `DPM - Photo ${props.rev}`;
  });

  useEffect(() => {
    if (previewSizes === undefined) {
      fetch("/api/config/preview-sizes")
        .then((r) => r.json() as Promise<string[]>)
        .then(setPreviewSizes)
        .catch((err) => console.error(err));
    }
  }, []);

  if (p2 === undefined) {
    return <div>Loading PHOTO ...</div>;
  }

  if (!photo) {
    return <div>No such photo</div>;
  }

  const tags = photo.exif.exifData.tags;
  const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

  return (
    <>
      <h1>{props.rev}</h1>

      <div>
        <a href={`/image/rev/${photo.namedFile.rev}`}>
          <img
            src={`/image/rev/${photo.namedFile.rev}/w640h480`}
            alt={"preview"}
          />
        </a>
      </div>

      <p>
        <a
          href={`https://www.dropbox.com/preview${photo.namedFile.path_lower}?context=browse&role=personal`}
        >
          View in Dropbox
        </a>
      </p>

      {previewSizes && (
        <ol>
          {previewSizes.map((previewSize) => (
            <li key={previewSize}>
              <a href={`/image/rev/${photo.namedFile.rev}/${previewSize}`}>
                {previewSize}
              </a>
            </li>
          ))}
        </ol>
      )}

      {gps && (
        <p>
          <a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a>
          {" | "}
          <a href={gps.geoHackUrl({ title: photo.namedFile.rev })}>GeoHack</a>
        </p>
      )}

      <pre>{JSON.stringify(photo, null, 2)}</pre>
    </>
  );
};

export default logRender(Photo);
