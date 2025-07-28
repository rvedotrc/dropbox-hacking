import GeoMap from "@components/map/GeoMap";
import logRender from "@lib/logRender";
import type { ContentHashCollection } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import * as L from "leaflet";
import React, { useDeferredValue, useMemo, useState } from "react";

import FilesTable from "./filesTable";
import MultiTagEditor from "./MultiTagEditor";

const ListOfFiles = ({
  files,
  date,
}: {
  files: readonly ContentHashCollection[];
  date: string;
}) => {
  const [selectedContentHashes, setSelectedContentHashes] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const prev = useDeferredValue(selectedContentHashes);

  console.log(
    `GeoMap curr=${selectedContentHashes.size} prev=${prev.size} is=${Object.is(selectedContentHashes, prev)}`,
  );

  const forMap = useMemo(
    () =>
      new Map(
        files.flatMap((t) =>
          t.gps
            ? [
                [
                  t.namedFiles[0].content_hash,
                  {
                    position: new L.LatLng(t.gps.lat, t.gps.long),

                    highlighted: selectedContentHashes.has(
                      t.namedFiles[0].content_hash,
                    ),
                  },
                ],
              ]
            : [],
        ),
      ),
    [files, selectedContentHashes],
  );

  return (
    <>
      <p>{files.length} files</p>

      {selectedContentHashes.size > 0 && (
        <MultiTagEditor
          key={[...selectedContentHashes].toSorted().join(" ")}
          contentHashes={selectedContentHashes}
          files={files.filter((f) => selectedContentHashes.has(f.contentHash))}
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
