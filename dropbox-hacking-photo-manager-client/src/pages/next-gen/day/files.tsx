import React, { useEffect, useMemo } from "react";

import logRender from "@lib/logRender";
import Navigate from "@components/navigate";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "../../../hooks/useLatestValueFromServerFeed";
import EditableTextField from "@components/editableTextField";
import FilesTable from "./filesTable";
import { useIdentity } from "../../../hooks/useIdentity";

const NGDayFiles = ({ date }: { date: string }) => {
  console.log("NGDayFiles", useIdentity());

  const latestValue = useLatestValueFromServerFeed<DayFilesResult>({
    type: "rx.ng.day.files",
    date,
  });

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

          <p>{latestValue.files.length} files</p>

          <FilesTable files={latestValue.files} />
        </>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(NGDayFiles);
