import EditableTextField from "@components/editableTextField";
import logRender from "@lib/logRender";
import type { PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import React, { useMemo } from "react";

import Tags from "../day/Tags";

const EditablePhotoEntry = ({
  contentHash,
  photoDbEntry,
}: {
  contentHash: string;
  photoDbEntry: PhotoDbEntry;
}) => {
  const onSaveDescription = useMemo(
    () => (newText: string) =>
      fetch(`/api/photo/content_hash/${contentHash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...(photoDbEntry ?? {}), description: newText }),
      }).then(() => {}),
    [contentHash, photoDbEntry],
  );

  const onSaveTags = useMemo(
    () => (newText: string) =>
      fetch(`/api/photo/content_hash/${contentHash}`, {
        method: "PATCH",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(photoDbEntry ?? {}),
          tags: newText.trim().replaceAll(/ /g, " ").split(" ").filter(Boolean),
        }),
      }).then(() => {}),
    [contentHash, photoDbEntry],
  );

  return (
    <div>
      <div>
        Description:{" "}
        <EditableTextField
          key={photoDbEntry.description ?? ""}
          value={photoDbEntry.description ?? ""}
          onSave={onSaveDescription}
        />
      </div>

      <div>
        Tags:{" "}
        <EditableTextField
          key={photoDbEntry.tags?.join(" ") ?? ""}
          value={photoDbEntry.tags?.join(" ") ?? ""}
          onSave={onSaveTags}
          renderInactive={({ value, placeholderText }) =>
            value === "" ? (
              placeholderText
            ) : (
              <Tags tags={photoDbEntry.tags ?? []} />
            )
          }
        />
      </div>
    </div>
  );
};

export default logRender(EditablePhotoEntry);
