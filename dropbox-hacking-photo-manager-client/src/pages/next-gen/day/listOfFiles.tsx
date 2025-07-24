import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { useState } from "react";

import FilesTable from "./filesTable";
import MultiTagEditor from "./MultiTagEditor";

export const ListOfFiles = ({
  files,
  date,
}: {
  files: DayFilesResult["files"];
  date: string;
}) => {
  const [selectedContentHashes, setSelectedContentHashes] = useState<
    ReadonlySet<string>
  >(() => new Set());

  return (
    <>
      <p>{files.length} files</p>

      {selectedContentHashes.size > 0 && (
        <MultiTagEditor
          key={[...selectedContentHashes].toSorted().join(" ")}
          contentHashes={selectedContentHashes}
          files={files.filter((f) =>
            selectedContentHashes.has(f.namedFile.content_hash),
          )}
        />
      )}

      <FilesTable
        files={files}
        selectedContentHashes={selectedContentHashes}
        onSelectedContentHashes={(t) => setSelectedContentHashes(t)}
        date={date}
      />
    </>
  );
};
