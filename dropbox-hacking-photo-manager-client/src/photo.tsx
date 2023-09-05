import * as React from "react";
import { useEffect, useState } from "react";
import {
  Photo,
  PhotoResponse,
} from "dropbox-hacking-photo-manager-server/dist/shared/types";
import GPSLatLong from "dropbox-hacking-photo-manager-server/dist/shared/gpsLatLong";

const Photo = (props: { rev: string }) => {
  const [photo, setPhoto] = useState<Photo | false | undefined>();
  const [previewSizes, setPreviewSizes] = useState<string[]>();

  useEffect(() => {
    if (photo === undefined) {
      fetch(`/api/photo/rev/${props.rev}`)
        .then((r) => r.json() as Promise<PhotoResponse>)
        .then((data) => setPhoto(data.photo));
    }
  }, [photo, props.rev]);

  useEffect(() => {
    if (previewSizes === undefined) {
      fetch("/api/config/preview-sizes")
        .then((r) => r.json() as Promise<string[]>)
        .then(setPreviewSizes);
    }
  }, []);

  if (photo === undefined) {
    return <div>Loading...</div>;
  }

  if (photo === false) {
    return <div>No such photo</div>;
  }

  const tags = photo.exif.exifData.tags;
  const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

  return (
    <>
      <h1>{props.rev}</h1>

      <div>
        <a href={`/image/rev/${photo.rev}`}>
          <img src={`/image/rev/${photo.rev}/w640h480`} alt={"preview"} />
        </a>
      </div>

      <p>
        <a
          href={`https://www.dropbox.com/preview${photo.path_lower}?context=browse&role=personal`}
        >
          View in Dropbox
        </a>
      </p>

      {previewSizes && (
        <ol>
          {previewSizes.map((previewSize) => (
            <li key={previewSize}>
              <a href={`/image/rev/${photo.rev}/${previewSize}`}>
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
          <a href={gps.geoHackUrl({ title: photo.rev })}>GeoHack</a>
        </p>
      )}

      <pre>{JSON.stringify(photo, null, 2)}</pre>
    </>
  );
};

export default Photo;
