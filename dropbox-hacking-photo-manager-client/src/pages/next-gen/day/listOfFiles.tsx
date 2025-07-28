import GeoMap from "@components/map/GeoMap";
import logRender from "@lib/logRender";
import { selectGPS } from "dropbox-hacking-photo-manager-shared";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import * as L from "leaflet";
import React, { useDeferredValue, useMemo, useState } from "react";

import FilesTable from "./filesTable";
import MultiTagEditor from "./MultiTagEditor";

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

  const prev = useDeferredValue(selectedContentHashes);

  console.log(
    `GeoMap curr=${selectedContentHashes.size} prev=${prev.size} is=${Object.is(selectedContentHashes, prev)}`,
  );

  const withGPS = useMemo(
    () =>
      files.map((f) => ({
        ...f,
        gps: selectGPS(f.photoDbEntry, f.exif, f.content.mediaInfo),
      })),
    [files],
  );

  const forMap = useMemo(
    () =>
      new Map(
        withGPS
          .filter(
            (
              t,
            ): t is typeof t & {
              readonly gps: NonNullable<(typeof t)["gps"]>;
            } => t.gps !== null,
          )
          .map((f) => [
            f.namedFile.content_hash,
            {
              position: new L.LatLng(
                f.gps.asSigned().lat,
                f.gps.asSigned().long,
              ),

              highlighted: selectedContentHashes.has(f.namedFile.content_hash),
            },
          ]),
      ),
    [withGPS, selectedContentHashes],
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

      <GeoMap positions={forMap} />

      <p>
        With GPS: {forMap.size} // Without GPS: {files.length - forMap.size}
      </p>
    </>
  );
};

export default logRender(ListOfFiles);
