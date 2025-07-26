import logRender from "@lib/logRender";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { useMemo, useState } from "react";

import FilesTable from "./filesTable";
import MultiTagEditor from "./MultiTagEditor";
import ShowMap from "./ShowMap";

const ListOfFiles = ({
  files,
  date,
}: {
  files: DayFilesResult["files"];
  date: string;
}) => {
  const [selectedContentHashes, setSelectedContentHashes] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const withGPS = useMemo(
    () =>
      files.map((f) => ({
        ...f,
        gps:
          (f.exif ? GPSLatLong.fromExif(f.exif) : null) ??
          (f.content.mediaInfo
            ? GPSLatLong.fromMediaInfo(f.content.mediaInfo)
            : null) ??
          null,
      })),
    [files],
  );

  const forMap = useMemo(
    () =>
      withGPS
        .filter(
          (
            t,
          ): t is typeof t & {
            readonly gps: NonNullable<(typeof t)["gps"]>;
          } => t.gps !== null,
        )
        .map((f) => ({
          position: f.gps,
          contentHash: f.namedFile.content_hash,
        })),
    [withGPS],
  );

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

      <ShowMap positions={forMap} />

      <p>
        With GPS: {forMap.length} // Without GPS: {files.length - forMap.length}
      </p>
    </>
  );
};

export default logRender(ListOfFiles);
