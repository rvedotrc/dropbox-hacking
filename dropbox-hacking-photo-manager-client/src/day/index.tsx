import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DayMetadataResponse,
  DPMChangeEvent,
  PhotosResponse,
} from "dropbox-hacking-photo-manager-shared";
import EditableTextField from "./editableTextField";
import logRender from "../logRender";
import DefaultThumbnailLoaderProvider from "../days/thumbnailLoaderContext";
import useVisibilityTracking from "../days/useVisibilityTracking";
import PhotoTile from "./photoTile";
import useApiResource from "./useApiResource";
import { isLeft } from "./fp";
import { useEvents } from "../context/eventEmitterContext";

const DayWithData = ({
  date,
  dayMetadata,
  dayPhotos,
}: {
  date: string;
  dayMetadata: DayMetadataResponse;
  dayPhotos: PhotosResponse;
}) => {
  const [visibleRevs, setVisibleRevs] = useState<Set<string>>();

  const parentRef = useRef<HTMLDivElement>(null);

  useVisibilityTracking({
    parentRef,
    listItemDataAttribute: "data-rev",
    onVisibleItems: setVisibleRevs,
    deps: [dayPhotos, parentRef.current],
  });

  useEffect(() => {
    document.title = `DPM - ${date}`;
  });

  const onSaveDescription = useMemo(
    () => (newText: string) =>
      fetch(`/api/day/${date}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: newText }),
      }).then(() => {}),
    [date],
  );

  return (
    <>
      <h1>{date}</h1>

      <EditableTextField
        key={dayMetadata.day_metadata.description}
        value={dayMetadata.day_metadata.description}
        onSave={onSaveDescription}
      />

      <p>{dayPhotos.photos.length} photos</p>

      <DefaultThumbnailLoaderProvider>
        <div ref={parentRef} className={"photoList"}>
          {dayPhotos.photos.map((photo) => (
            <PhotoTile
              photo={photo}
              isVisible={visibleRevs?.has(photo.rev) || false}
              key={photo.rev}
            />
          ))}
        </div>
      </DefaultThumbnailLoaderProvider>
    </>
  );
};

const DayWithDataLogged = logRender(DayWithData);

const Day = ({ date }: { date: string }) => {
  const dayMetadata = useApiResource<DayMetadataResponse>({
    url: `/api/day/${date}`,
  });
  const dayPhotos = useApiResource<PhotosResponse>({
    url: `/api/photos/${date}`,
  });

  useEffect(() => {
    document.title = `DPM - ${date}`;
  }, [date]);

  const events = useEvents();
  const handler = useMemo(
    () => (e: DPMChangeEvent) => {
      if (e.event_resource === "days") {
        dayMetadata.refresh();
      }
    },
    [dayMetadata],
  );

  useEffect(() => {
    events?.on("change", handler);
    return () => {
      events?.off("change", handler);
    };
  }, []);

  if (!dayPhotos.result || !dayMetadata.result) {
    return <div>Loading...</div>;
  }

  if (isLeft(dayPhotos.result) || isLeft(dayMetadata.result)) {
    return <div>FAIL :-(</div>;
  }

  return (
    <DayWithDataLogged
      date={date}
      dayPhotos={dayPhotos.result.value}
      dayMetadata={dayMetadata.result.value}
    />
  );
};

export default logRender(Day);
