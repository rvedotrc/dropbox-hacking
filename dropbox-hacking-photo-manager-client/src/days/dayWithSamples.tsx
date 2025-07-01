import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import EditableTextField from "../day/editableTextField";
import logRender from "@/logRender";
import SamePageLink from "../samePageLink";
import type { Subscribable } from "./emittableSubscribable";
import SamplePhoto from "./samplePhoto";

export const dayDateAttribute = "data-date";

const dayNames: readonly string[] = "søn man tir ons tor fre lør".split(" ");

export const dayWithSamples = ({
  day,
  withSamples,
  s,
}: {
  day: CountsByDateEntry & { description?: string };
  withSamples: boolean;
  s: Subscribable<{ date: string; visible: boolean }>;
}): React.ReactElement | null => {
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      s.subscribe((e) => {
        if (e.date === day.date) setVisible(e.visible);
      }),
    [s, day.date],
  );

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
      <SamePageLink routeState={{ route: "day", date: day.date }}>
        <div className={"dateAndStats"}>
          <span className={"date"}>{day.date}</span>
          <span className={"dayName"}>
            {dayNames[new Date(day.date).getDay()]}
          </span>
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
                <SamplePhoto
                  key={photo.namedFile.rev}
                  photo={photo}
                  visible={visible}
                />
              ))}
            </div>
          )}
        </div>
      </SamePageLink>
    </li>
  );
};

export default logRender(dayWithSamples);
