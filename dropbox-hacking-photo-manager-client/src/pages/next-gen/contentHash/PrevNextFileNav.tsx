import SamePageLink from "@components/samePageLink";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import React from "react";

export const PrevNextFileNav = ({
  context,
}: {
  context: { date: string; rev: string };
}) => {
  const dayFiles = useLatestValueFromServerFeed({
    type: "rx.ng.day.files",
    date: context.date,
  });

  const indexOfThisFile = dayFiles?.files.findIndex(
    (f) => f.namedFile.rev === context.rev,
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
            contentHash: previousFile.namedFile.content_hash,
            context: {
              date: context.date,
              rev: previousFile.namedFile.rev,
            },
          }}
        >
          &larr;{" "}
          {previousFile.namedFile.name.replaceAll(
            previousFile.namedFile.content_hash,
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
            contentHash: nextFile.namedFile.content_hash,
            context: {
              date: context.date,
              rev: nextFile.namedFile.rev,
            },
          }}
        >
          {nextFile.namedFile.name.replaceAll(
            nextFile.namedFile.content_hash,
            "#",
          )}{" "}
          &rarr;
        </SamePageLink>
      )}
    </div>
  );
};
