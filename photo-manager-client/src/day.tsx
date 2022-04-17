import * as React from 'react';
import {useEffect, useState} from "react";
import {Photo, ThumbnailsByRev} from "../../src/photo-manager/shared/types";

export default (props: { date: string }) => {
    const [photos, setPhotos] = useState<Photo[]>();
    const [revToThumbnail, setRevToThumbnail] = useState(new Map<string, string | undefined>());

    console.log("render day");

    for (const k of [...revToThumbnail.keys()].sort()) {
        console.log({ rev: k, thumbnail: revToThumbnail.get(k) });
    }
    console.log("end of revs");

    if (!photos) {
        useEffect(() => undefined);

        fetch(`/api/photos/${props.date}`)
            .then(r => r.json())
            .then(data => setPhotos(data.photos));

        return <div>Loading...</div>;
    }

    if (photos.length === 0) {
        useEffect(() => {
            if (revToThumbnail.size > 0) setRevToThumbnail(new Map());
        });

        return <>
            <h1>{props.date}</h1>
            <div>No data</div>
        </>;
    }

    const photosWithThumbnails = photos.map(photo => ({ ...photo, thumbnail: revToThumbnail.get(photo.rev) }));

    useEffect(() => {
        const photoRevs = new Set(photos.map(photo => photo.rev));
        let changed = false;

        for (const rev of revToThumbnail.keys()) {
            if (!photoRevs.has(rev)) {
                revToThumbnail.delete(rev);
                changed = true;
            }
        }

        const needToRequest: string[] = [];

        for (const rev of photoRevs) {
            if (!revToThumbnail.has(rev)) {
                needToRequest.push(rev);
                revToThumbnail.set(rev, undefined);
            }
        }

        needToRequest.sort();

        while (true) {
            const slice = needToRequest.splice(0, 25);
            if (slice.length === 0) break;

            console.log(`Requesting ${slice.join(',')}`);

            fetch(`/api/thumbnail/128/revs/${slice.join(',')}`)
                .then(res => res.json() as Promise<ThumbnailsByRev>)
                .then(data => {
                    console.log(`Got response for ${slice.join(',')}`, data);

                    for (const r of data.thumbnails_by_rev) {
                        console.log(`got thumbnail for ${r.rev}`)
                        revToThumbnail.set(r.rev, r.thumbnail);
                    }

                    setRevToThumbnail(new Map(revToThumbnail));
                    console.log("fetch complete");
                });
        }

        if (changed) setRevToThumbnail(new Map(revToThumbnail));
    });

    return <>
        <h1>{props.date}</h1>

        <p>{photos.length} photos</p>

        <div className={"photoList"}>
            {photosWithThumbnails.map(photo =>
                <a className={"photoItem"} key={photo.id} href={`/photo.html?rev=${photo.rev}`}>
                    <img
                        src={photo.thumbnail ? `data:image/jpeg;base64,${photo.thumbnail}` : `/placeholder.png`}
                        style={{
                            width: photo.thumbnail ? undefined : '128px',
                            height: photo.thumbnail ? undefined : '128px',
                        }}
                    />
                    <div className={"clientModified"}>{photo.client_modified}</div>
                    <div className={"name"}>{photo.name}</div>
                    <div className={"makeAndModel"}>{photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}</div>
                </a>
            )}
        </div>
    </>;
}
