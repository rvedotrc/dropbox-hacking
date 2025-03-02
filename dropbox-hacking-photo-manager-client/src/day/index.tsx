import {
  DayMetadataResponse,
  PhotosResponse,
} from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDayPhotos } from "../context/feeds";
import useVisibilityTracking from "../days/useVisibilityTracking";
import { isLeft } from "../fp";
import logRender from "../logRender";
import EditableTextField from "./editableTextField";
import PhotoTile from "./photoTile";
import { useRxFeedsViaMultiplexer } from "../context/rx/rxRecordFeedContext";
import { map } from "rxjs";
import { useLatestValue } from "../context/rx/useLatestValue";

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
            key={photo.file.rev}
            photo={photo}
            isVisible={visibleRevs?.has(photo.file.rev) || false}
          />
        ))}
      </div>
    </>
  );
};

const DayWithDataLogged = logRender(DayWithData);

const Day = ({ date }: { date: string }): React.ReactElement | null => {
  const mx = useRxFeedsViaMultiplexer();

  const dayMetadataObserver = useMemo(
    () =>
      mx?.days
        .pipe(map((t) => t.image[date]))
        .pipe(map((m) => ({ day_metadata: m }))),
    [mx, date],
  );

  const dayMetadata = useLatestValue(dayMetadataObserver);
  const dayPhotos = useDayPhotos(date);

  useEffect(() => {
    document.title = `DPM - ${date}`;
  }, [date]);

  if (!dayPhotos || !dayMetadata) {
    return <div>Loading DAY ...</div>;
  }

  if (isLeft(dayPhotos)) {
    return <div>Error DAY :-(</div>;
  }

  return (
    <DayWithDataLogged
      date={date}
      dayPhotos={dayPhotos.right}
      dayMetadata={dayMetadata}
    />
  );
};

export default logRender(Day);
