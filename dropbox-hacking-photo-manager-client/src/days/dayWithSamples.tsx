import SamePageLink from "../samePageLink";
import SamplePhoto from "./samplePhoto";
import * as React from "react";
import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";
import { useMemo } from "react";
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
                <SamplePhoto key={photo.rev} photo={photo} visible={visible} />
              ))}
            </div>
          )}
        </div>
      </SamePageLink>
    </li>
  );
};

export default dayWithSamples;
