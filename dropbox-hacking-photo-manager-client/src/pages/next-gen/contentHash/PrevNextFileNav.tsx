import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import React from "react";

export const PrevNextFileNav = ({
  context,
}: {
  context: { date: string; contentHash: string };
}) => {
  const dayFiles = useLatestValueFromServerFeed({
    type: "rx.ng.day.files",
    date: context.date,
  });

  const indexOfThisFile = dayFiles?.files.findIndex(
    (f) => f.contentHash === context.contentHash,
  );

  const previousFile =
    dayFiles && indexOfThisFile !== undefined && indexOfThisFile > 0
      ? dayFiles.files[indexOfThisFile - 1]
      : undefined;
  const nextFile =
    dayFiles &&
    indexOfThisFile !== undefined &&
    indexOfThisFile + 1 < dayFiles.files.length
      ? dayFiles.files[indexOfThisFile + 1]
      : undefined;

  if (!previousFile && !nextFile) return;

  return (
    <div>
      {previousFile && (
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: previousFile.contentHash,
            context: {
              date: context.date,
              contentHash: previousFile.contentHash,
            },
          }}
        >
          &larr;{" "}
          {previousFile.namedFiles[0].name.replaceAll(
            previousFile.contentHash,
            "#",
          )}
        </SamePageLink>
      )}
      {" ~ "}
      <SamePageLink
        routeState={{
          route: "route/next-gen/day/files",
          date: context.date,
        }}
      >
        &uarr; {context.date} &uarr;
      </SamePageLink>
      {" ~ "}
      {nextFile && (
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: nextFile.contentHash,
            context: {
              date: context.date,
              contentHash: nextFile.contentHash,
            },
          }}
        >
          {nextFile.namedFiles[0].name.replaceAll(nextFile.contentHash, "#")}{" "}
          &rarr;
        </SamePageLink>
      )}
    </div>
  );
};
