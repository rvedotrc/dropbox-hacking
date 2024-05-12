import * as React from "react";
import { useEffect, useState } from "react";
import {
  DayMetadata,
  DayMetadataResponse,
  Payload,
  Photo,
  PhotosResponse,
  ThumbnailsByRevResponse,
} from "dropbox-hacking-photo-manager-shared";
import EditableTextField from "./editableTextField";
import SamePageLink from "./samePageLink";

const Day = (props: { date: string; setState: (payload: Payload) => void }) => {
  const [photos, setPhotos] = useState<Photo[]>();
  const [revToThumbnail, setRevToThumbnail] = useState(
    new Map<string, string | undefined>(),
  );
  const [dayMetadata, setDayMetadata] = useState<DayMetadata>();

  // const getStats = () => {
  //     const p = photos || [];
  //     const wanted = new Set(p.map(ph => ph.rev));
  //     const got = new Set(revToThumbnail.keys());
  //
  //     const numWanted = [...wanted].filter(rev => !revToThumbnail.has(rev)).length;
  //     const numRequested = [...wanted].filter(rev => revToThumbnail.has(rev) && revToThumbnail.get(rev) === undefined).length;
  //     const numGot = [...wanted].filter(rev => revToThumbnail.has(rev) && revToThumbnail.get(rev) !== undefined).length;
  //     const numUnwanted = [...got].filter(rev => !wanted.has(rev)).length;
  //
  //     return { numWanted, numRequested, numGot, numUnwanted };
  // };
  //
  // console.log(
  //     "render day",
  //     {
  //         date: props.date,
  //         revs: (photos === undefined) ? undefined : [...photos.map(p => p.rev)].sort().join(','),
  //         metadataLoaded: (dayMetadata !== undefined),
  //         thumbRevs: [...revToThumbnail.keys()].sort().join(','),
  //         ...getStats(),
  //     }
  // );

  useEffect(() => {
    document.title = `DPM - ${props.date}`;
  });

  // Discard any unwanted thumbnails
  useEffect(() => {
    const wantedRevs = new Set((photos || []).map((p) => p.rev));

    let changed = false;
    for (const rev of revToThumbnail.keys()) {
      if (!wantedRevs.has(rev)) {
        revToThumbnail.delete(rev);
        changed = true;
      }
    }

    if (changed) setRevToThumbnail(new Map(revToThumbnail));
  }, [photos, revToThumbnail]);

  // Fetch the list of photos & metadata
  useEffect(() => {
    fetch(`/api/photos/${props.date}`)
      .then((r) => r.json() as Promise<PhotosResponse>)
      .then((data) => setPhotos(data.photos));

    fetch(`/api/day/${props.date}`)
      .then((res) => res.json() as Promise<DayMetadataResponse>)
      .then((data) => setDayMetadata(data.day_metadata));
  }, [props.date]);

  // Load any missing thumbnails
  useEffect(() => {
    if (photos === undefined) return;

    const photoRevs = new Set(photos.map((photo) => photo.rev));

    const needToRequest: string[] = [];

    for (const rev of photoRevs) {
      if (!revToThumbnail.has(rev)) {
        needToRequest.push(rev);
        // Use undefined to record the fact that we have made the request
        revToThumbnail.set(rev, undefined);
      }
    }

    needToRequest.sort();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const slice = needToRequest.splice(0, 25);
      if (slice.length === 0) break;

      // console.log(`Requesting ${slice.join(',')}`);

      fetch(`/api/thumbnail/128/revs/${slice.join(",")}`)
        .then((res) => res.json() as Promise<ThumbnailsByRevResponse>)
        .then((data) => {
          // console.log(`Got response for ${slice.join(',')}`, data);

          for (const r of data.thumbnails_by_rev) {
            // console.log(`got thumbnail for ${r.rev}`)
            revToThumbnail.set(r.rev, r.thumbnail);
          }

          setRevToThumbnail(new Map(revToThumbnail));
          // console.log("fetch complete");
        });
    }
  }, [photos, revToThumbnail]);

  if (!photos || !dayMetadata) {
    return (
      <>
        <h1>{props.date}</h1>
        <div>Loading...</div>
      </>
    );
  }

  const photosWithThumbnails = photos.map((photo) => ({
    ...photo,
    thumbnail: revToThumbnail.get(photo.rev),
  }));

  const cleanedName = (photo: Photo) => {
    if (photo.content_hash) {
      return photo.name.replace(photo.content_hash, "#");
    }

    return photo.name;
  };

  return (
    <>
      <h1>{props.date}</h1>

      <EditableTextField
        value={dayMetadata.description}
        onSave={(newText) =>
          fetch(`/api/day/${props.date}`, {
            method: "PATCH",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: newText }),
          })
            .then((res) => res.json() as Promise<DayMetadataResponse>)
            .then((newData) => setDayMetadata(newData.day_metadata))
        }
      />

      <p>{photos.length} photos</p>

      <div className={"photoList"}>
        {photosWithThumbnails.map((photo) => (
          <SamePageLink
            className={"photoItem"}
            key={photo.id}
            href={`/photo/rev/${photo.rev}`}
            state={{ route: "photo", rev: photo.rev }}
            setState={props.setState}
          >
            <img
              src={
                photo.thumbnail
                  ? `data:image/jpeg;base64,${photo.thumbnail}`
                  : `/placeholder.png`
              }
              alt={"thumbnail"}
              style={{
                width: photo.thumbnail ? undefined : "128px",
                height: photo.thumbnail ? undefined : "128px",
              }}
            />
            <div className={"clientModified"}>{photo.client_modified}</div>
            <div className={"name"}>{cleanedName(photo)}</div>
            <div className={"makeAndModel"}>
              {photo.exif.exifData.tags?.Make} {photo.exif.exifData.tags?.Model}
            </div>
          </SamePageLink>
        ))}
      </div>
    </>
  );
};

export default Day;
