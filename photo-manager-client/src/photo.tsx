import * as React from 'react';
import {useEffect, useState} from "react";
import {Photo, PhotoResponse} from "../../src/photo-manager/shared/types";
import GPSLatLong from "../../src/photo-manager/shared/gpsLatLong";

export default (props: { rev: string }) => {
    const [photo, setPhoto] = useState<Photo | false | undefined>();

    useEffect(() => {
        if (photo === undefined) {
            fetch(`/api/photo/rev/${props.rev}`)
                .then(r => r.json() as Promise<PhotoResponse>)
                .then(data => setPhoto(data.photo));
        }
    }, [props.rev]);

    if (photo === undefined) {
        return <div>Loading...</div>;
    }

    if (photo === false) {
        return <div>No such photo</div>;
    }

    const tags = photo.exif.exifData.tags;
    const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

    return <>
        <h1>{props.rev}</h1>

        <div>
            <a href={`/image/rev/${photo.rev}`}>
                <img src={`/image/rev/${photo.rev}/w640h480`} alt={"preview"}/>
            </a>
        </div>

        <p>
          <a href={`https://www.dropbox.com/preview${photo.path_lower}?context=browse&role=personal`}>View in Dropbox</a>
        </p>

        {gps &&
          <p>
            <a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a>
            {' | '}
            <a href={gps.geoHackUrl({ title: photo.rev })}>GeoHack</a>
          </p>
        }

        <pre>{JSON.stringify(photo, null, 2)}</pre>
    </>;
};
