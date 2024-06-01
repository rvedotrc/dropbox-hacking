import SamePageLink from "../samePageLink";
import SamplePhoto from "./samplePhoto";
import * as React from "react";
import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useMemo } from "react";
import { useThumbnailLoader } from "./thumbnailLoaderContext";
import EditableTextField from "../day/editableTextField";

export const dayDateAttribute = "data-date";

export const dayWithSamples = ({
  day,
  visible,
  withSamples,
}: {
  day: CountsByDateEntry & { description?: string };
  visible: boolean;
  withSamples: boolean;
}) => {
  const loader = useThumbnailLoader();

  useEffect(() => {
    // console.log(`Date ${day.date} visible=${visible}`);

    if (withSamples) {
      if (visible) loader?.setWanted(day.samplePhotos.map((p) => p.rev));
      if (!visible) loader?.setUnwanted(day.samplePhotos.map((p) => p.rev));
    }
  }, [withSamples, day.date, visible]);

  const onSaveDescription = useMemo(
    () => (newText: string) =>
      fetch(`/api/day/${day.date}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: newText }),
      }).then(() => {}),
    [day.date],
  );

  return (
    <li key={day.date} {...{ [dayDateAttribute]: day.date }}>
      <SamePageLink
        state={{ route: "day", date: day.date }}
        href={`/day/${day.date}`}
      >
        <div className={"dateAndStats"}>
          <span className={"date"}>{day.date}</span>
          <span className={"count"}>{day.count}</span>
          <span className={"countWithGps"}>{day.countWithGps}</span>
        </div>

        <div className={"descriptionAndSamples"}>
          <span className={"description"}>
            <EditableTextField
              key={day.description}
              value={day.description || ""}
              onSave={onSaveDescription}
            />
          </span>
          {withSamples && (
            <div className={"samples"}>
              {day.samplePhotos.map((photo) => (
                <SamplePhoto key={photo.rev} photo={photo} />
              ))}
            </div>
          )}
        </div>
      </SamePageLink>
    </li>
  );
};

export default dayWithSamples;
