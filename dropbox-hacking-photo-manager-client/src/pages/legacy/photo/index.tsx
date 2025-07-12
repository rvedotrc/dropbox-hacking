import EditableTextField from "@components/editableTextField";
import SamePageLink from "@components/samePageLink";
import { useAdditionalFeeds } from "@hooks/legacyRxFeeds/additionalFeeds";
import { useLatestValue } from "@hooks/useLatestValue";
import logRender from "@lib/logRender";
import { GPSLatLong, Photo } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";

const Photo = (props: { rev: string }): React.ReactElement | null => {
  const [previewSizes, setPreviewSizes] = useState<string[]>();

  const p2 = useLatestValue(useAdditionalFeeds()?.filesAndExifAndPhotoDb);
  const photo = p2
    ? Object.values(p2).find((p) => p.namedFile.rev === props.rev)
    : undefined;

  const date = photo?.namedFile.client_modified.substring(0, 10);
  const photoDbEntry = photo?.photoDbEntry;

  const onSaveDescription = useMemo(
    () => (newText: string) =>
      fetch(`/api/photo/content_hash/${photo!.namedFile.content_hash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...(photoDbEntry ?? {}), description: newText }),
      }).then(() => {}),
    [props.rev, photoDbEntry],
  );

  const onSaveTags = useMemo(
    () => (newText: string) =>
      fetch(`/api/photo/content_hash/${photo!.namedFile.content_hash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(photoDbEntry ?? {}),
          tags: newText.trim().replaceAll(/ /g, " ").split(" "),
        }),
      }).then(() => {}),
    [props.rev, photoDbEntry],
  );

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

  const dayPhotos = useLatestValue(useAdditionalFeeds()?.countsByDate)?.find(
    (item) => item.date === date,
  );
  const photoRevs = dayPhotos?.photos ?? [];

  if (p2 === undefined) {
    return <div>Loading PHOTO ...</div>;
  }

  if (!photo || !date) {
    return <div>No such photo</div>;
  }

  const tags = photo.exif.exifData.tags;
  const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

  const sortedRevs = photoRevs
    .toSorted((a, b) =>
      a.namedFile.client_modified.localeCompare(b.namedFile.client_modified),
    )
    .map((t) => t.namedFile.rev);

  const thisIndex = sortedRevs.indexOf(props.rev);

  const prevNext = {
    previousRev: thisIndex >= 1 ? sortedRevs[thisIndex - 1] : undefined,
    nextRev:
      thisIndex >= 0 && thisIndex < sortedRevs.length - 1
        ? sortedRevs[thisIndex + 1]
        : undefined,
  };

  return (
    <>
      <div className="navigation">
        <ul>
          <li>
            🔼{" "}
            <SamePageLink
              routeState={{
                route: "day",
                date,
              }}
            >
              {date}
            </SamePageLink>
          </li>

          {prevNext?.previousRev && (
            <li>
              {"◀️ "}
              <SamePageLink
                routeState={{
                  route: "photo",
                  rev: prevNext.previousRev,
                }}
              >
                {prevNext.previousRev}
              </SamePageLink>
            </li>
          )}

          {prevNext?.nextRev && (
            <>
              <li>
                {"▶️ "}
                <SamePageLink
                  routeState={{
                    route: "photo",
                    rev: prevNext.nextRev,
                  }}
                >
                  {prevNext.nextRev}
                </SamePageLink>
              </li>
            </>
          )}
        </ul>
      </div>

      <h1>{props.rev}</h1>

      <p>
        <EditableTextField
          key={photoDbEntry?.description ?? ""}
          value={photoDbEntry?.description ?? ""}
          onSave={onSaveDescription}
        />
      </p>

      <p>
        <EditableTextField
          key={photoDbEntry?.tags?.join(" ") ?? ""}
          value={photoDbEntry?.tags?.join(" ") ?? ""}
          onSave={onSaveTags}
        />
      </p>

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
