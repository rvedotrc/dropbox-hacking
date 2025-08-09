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
          t.gps.effective
            ? [
                [
                  t.namedFiles[0].content_hash,
                  {
                    position: new L.LatLng(
                      t.gps.effective.lat,
                      t.gps.effective.long,
                    ),

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

  const mapListeners = useMemo<Parameters<typeof GeoMap>[0]["listeners"]>(
    () => ({
      onClickMarker: (e, key) => {
        setSelectedContentHashes((before) => {
          console.log("on click marker", key, e);
          const copy = new Set(before);
          if (copy.has(key)) copy.delete(key);
          else copy.add(key);
          return copy;
        });
      },
    }),
    [],
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

      <GeoMap positions={forMap} listeners={mapListeners} />

      <p>
        With GPS: {forMap.size} // Without GPS: {files.length - forMap.size}
      </p>
    </>
  );
};

export default logRender(ListOfFiles);
