import * as React from 'react';
import {useState} from "react";
import {Photo} from "../../src/photo-manager/shared/types";
import GPSLatLong from "./gpsLatLong";

export default (props: { rev: string }) => {
    const [photo, setPhoto] = useState<Photo | false | undefined>();

    if (photo === undefined) {
        fetch(`/api/photo/rev/${props.rev}`)
            .then(r => { console.log({ r }); return r; })
            .then(r => r.json())
            .then(data => setPhoto(data.photo));

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
                <img src={`/api/thumbnail/640/rev/${photo.rev}`} alt={"preview"}/>
            </a>
        </div>

        <p>
          <a href={`https://www.dropbox.com/preview${photo.path_lower}?context=browse&role=personal`}>View in Dropbox</a>
        </p>

        {gps &&
          <p><a href={gps.googleMapsUrl({ zoom: 15 })}>Google Maps</a></p>
        }

        <pre>{JSON.stringify(photo, null, 2)}</pre>
    </>;
};
