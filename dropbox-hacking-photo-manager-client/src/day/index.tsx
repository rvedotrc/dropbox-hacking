import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DayMetadataResponse,
  PhotosResponse,
} from "dropbox-hacking-photo-manager-shared";
import EditableTextField from "./editableTextField";
import logRender from "../logRender";
import useVisibilityTracking from "../days/useVisibilityTracking";
import PhotoTile from "./photoTile";
import { useDay, useDayPhotos } from "../context/feeds";
import { isLeft } from "../fp";

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

      <p>
        <EditableTextField
          key={dayMetadata.day_metadata.description}
          value={dayMetadata.day_metadata.description}
          onSave={onSaveDescription}
        />
      </p>

      <p>{dayPhotos.photos.length} photos</p>

      <div ref={parentRef} className={"photoList"}>
        {dayPhotos.photos.map((photo) => (
          <PhotoTile
            photo={photo}
            isVisible={visibleRevs?.has(photo.rev) || false}
            key={photo.rev}
          />
        ))}
      </div>
    </>
  );
};

const DayWithDataLogged = logRender(DayWithData);

const Day = ({ date }: { date: string }) => {
  const dayMetadata = useDay(date);
  const dayPhotos = useDayPhotos(date);

  useEffect(() => {
    document.title = `DPM - ${date}`;
  }, [date]);

  if (!dayPhotos || !dayMetadata) {
    return <div>Loading DAY ...</div>;
  }

  if (isLeft(dayPhotos) || isLeft(dayMetadata)) {
    return <div>Error DAY :-(</div>;
  }

  return (
    <DayWithDataLogged
      date={date}
      dayPhotos={dayPhotos.right}
      dayMetadata={dayMetadata.right}
    />
  );
};

export default logRender(Day);
