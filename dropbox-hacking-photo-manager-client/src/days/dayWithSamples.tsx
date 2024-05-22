import SamePageLink from "../samePageLink";
import SamplePhoto from "./samplePhoto";
import * as React from "react";
import { CountsByDateEntry } from "dropbox-hacking-photo-manager-shared";
import { useEffect } from "react";
import { useThumbnailLoader } from "./thumbnailLoaderContext";

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

  return (
    <li key={day.date} {...{ [dayDateAttribute]: day.date }}>
      <SamePageLink
        state={{ route: "day", date: day.date }}
        href={`/day/${day.date}`}
      >
        <span className={"date"}>{day.date}</span>
        <span className={"count"}>{day.count}</span>
        <span className={"countWithGps"}>{day.countWithGps}</span>
        <span className={"description"}>
          {day.description === undefined ? "-" : day.description}
        </span>
        {withSamples && (
          <span className={"samples"}>
            {day.samplePhotos.map((photo) => (
              <SamplePhoto key={photo.rev} photo={photo} />
            ))}
          </span>
        )}
      </SamePageLink>
    </li>
  );
};

export default dayWithSamples;
