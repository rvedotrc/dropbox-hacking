import EditableTextField from "@components/editableTextField";
import PhotoTile from "@components/photoTile";
import SamePageLink from "@components/samePageLink";
import { useAdditionalFeeds } from "@hooks/legacyRxFeeds/additionalFeeds";
import { useRxFeedsViaMultiplexer } from "@hooks/legacyRxFeeds/rxRecordFeedContext";
import { useLatestValue } from "@hooks/useLatestValue";
import useVisibilityTracking from "@hooks/useVisibilityTracking";
import logRender from "@lib/logRender";
import {
  DayMetadataResponse,
  PhotosResponse,
} from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { map } from "rxjs";

const DayWithData = ({
  date,
  dayMetadata,
  dayPhotos,
}: {
  date: string;
  dayMetadata: DayMetadataResponse;
  dayPhotos: PhotosResponse;
}) => {
  const [visibleRevs, _setVisibleRevs] = useState<Set<string>>();

  const parentRef = useRef<HTMLDivElement>(null);

  useVisibilityTracking({
    parentRef,
    listItemDataAttribute: "data-rev",
    // onVisibleItems: setVisibleRevs,
    // deps: [dayPhotos, parentRef.current],
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

  const feeds = useAdditionalFeeds();
  if (!feeds) return null;

  const justCountsByDateFeed = useMemo(
    () =>
      feeds?.countsByDate.pipe(
        map((v) => v.map((item) => [item.date, item.count] as const)),
      ),
    [feeds],
  );

  const prevNext = useLatestValue(
    useMemo(
      () =>
        justCountsByDateFeed.pipe(
          map((counts) => {
            const dates = counts.map((t) => t[0]);
            const previousDay = dates
              .filter((t) => t.localeCompare(date) < 0)
              .toSorted()
              .pop();
            const nextDay = dates
              .filter((t) => t.localeCompare(date) > 0)
              .toSorted()
              .shift();
            return { previousDay, nextDay };
          }),
        ),
      [justCountsByDateFeed, date],
    ),
  );

  const month = date.substring(0, 7);

  return (
    <>
      <div className="navigation">
        <ul>
          <li>
            🔼{" "}
            <SamePageLink
              routeState={{
                route: "month",
                month,
              }}
            >
              {month}
            </SamePageLink>
          </li>

          {prevNext?.previousDay && (
            <li>
              {"◀️ "}
              <SamePageLink
                routeState={{
                  route: "day",
                  date: prevNext.previousDay,
                }}
              >
                {prevNext.previousDay}
              </SamePageLink>
            </li>
          )}

          {prevNext?.nextDay && (
            <>
              <li>
                {"▶️ "}
                <SamePageLink
                  routeState={{
                    route: "day",
                    date: prevNext.nextDay,
                  }}
                >
                  {prevNext.nextDay}
                </SamePageLink>
              </li>
            </>
          )}
        </ul>
      </div>

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
        {dayPhotos.photos
          .toSorted((a, b) =>
            a.namedFile.client_modified.localeCompare(
              b.namedFile.client_modified,
            ),
          )
          .map((photo) => (
            <PhotoTile
              key={photo.namedFile.rev}
              photo={photo}
              isVisible={visibleRevs?.has(photo.namedFile.rev) || false}
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
        .pipe(map((t) => t.image[date] ?? { date, description: "" }))
        .pipe(map((m) => ({ day_metadata: m }))),
    [mx, date],
  );

  const dayMetadata = useLatestValue(dayMetadataObserver);
  const dayPhotos = useLatestValue(useAdditionalFeeds()?.countsByDate)?.find(
    (item) => item.date === date,
  );

  useEffect(() => {
    document.title = `DPM - ${date}`;
  }, [date]);

  if (!dayPhotos || !dayMetadata) {
    return <div>Loading DAY ...</div>;
  }

  return (
    <DayWithDataLogged
      date={date}
      dayPhotos={dayPhotos}
      dayMetadata={dayMetadata}
    />
  );
};

export default logRender(Day);
