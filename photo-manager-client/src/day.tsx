import * as React from 'react';
import {useState} from "react";
import {Photo} from "../../src/photo-manager/shared/types";

export default (props: { date: string }) => {
    const [photos, setPhotos] = useState<Photo[]>();

    if (!photos) {
        fetch(`/api/photos/${props.date}`)
            .then(r => r.json())
            .then(data => setPhotos(data.photos));

        return <div>Loading...</div>;
    }

    if (photos.length === 0) {
        return <>
            <h1>{props.date}</h1>
            <div>No data</div>
        </>;
    }

    return <>
        <h1>{props.date}</h1>

        <p>{photos.length} photos</p>

        <div className={"photoList"}>
            {photos.map(photo =>
                <a className={"photoItem"} key={photo.id} href={`/photo.html?rev=${photo.rev}`}>
                    <img src={`/api/thumbnail/128/rev/${photo.rev}`}/>
                    <div className={"clientModified"}>{photo.client_modified}</div>
                    <div className={"name"}>{photo.name}</div>
                    <div className={"makeAndModel"}>{photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}</div>
                </a>
            )}
        </div>
    </>;
}
