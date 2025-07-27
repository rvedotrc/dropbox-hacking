import EditableTextField from "@components/editableTextField";
import Navigate from "@components/navigate";
import SamePageLink from "@components/samePageLink";
import { useIdentity } from "@hooks/useIdentity";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import React, { useEffect, useMemo } from "react";

import ListOfFiles from "./listOfFiles";

const NGDayFiles = ({ date }: { date: string }) => {
  console.log("NGDayFiles", useIdentity());

  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.day.files",
    date,
  });

  const listOfDays = useLatestValueFromServerFeed({
    type: "rx.ng.list-of-days",
    withSamples: false,
  });

  const indexOfToday = useMemo(
    () => listOfDays?.findIndex((item) => item.date === date),
    [listOfDays, date],
  );
  const previousDay =
    listOfDays && indexOfToday !== undefined && indexOfToday > 0
      ? listOfDays[indexOfToday - 1]
      : undefined;
  const nextDay =
    listOfDays &&
    indexOfToday !== undefined &&
    indexOfToday < listOfDays.length - 1
      ? listOfDays[indexOfToday + 1]
      : undefined;

  const dayMetadata = latestValue?.dayMetadata;

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

  useEffect(() => {
    document.title = `DPMNG - ${date}`;
  });

  return (
    <>
      <Navigate />

      <div>
        {previousDay && (
          <SamePageLink
            routeState={{
              route: "route/next-gen/day/files",
              date: previousDay.date,
            }}
          >
            &larr; {previousDay.date}
          </SamePageLink>
        )}

        {" ~ "}

        {nextDay && (
          <SamePageLink
            routeState={{
              route: "route/next-gen/day/files",
              date: nextDay.date,
            }}
          >
            {nextDay.date} &rarr;
          </SamePageLink>
        )}
      </div>

      <h1>{date}</h1>

      {latestValue ? (
        <>
          <p>
            <EditableTextField
              key={dayMetadata?.description ?? ""}
              value={dayMetadata?.description ?? ""}
              onSave={onSaveDescription}
            />
          </p>

          <ListOfFiles files={latestValue.files} date={date} />
        </>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(NGDayFiles);
