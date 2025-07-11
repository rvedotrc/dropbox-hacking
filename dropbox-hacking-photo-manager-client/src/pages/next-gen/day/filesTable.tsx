import React, { useMemo, useRef, useState } from "react";

import logRender from "@lib/logRender";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import useVisibilityTracking from "@hooks/useVisibilityTracking";
import FileRow from "./FileRow";

const FilesTable = ({
  files,
  selectedContentHashes,
  onSelectedContentHashes,
  date,
}: {
  files: DayFilesResult["files"];
  selectedContentHashes: ReadonlySet<string>;
  onSelectedContentHashes: (selectedContentHashes: ReadonlySet<string>) => void;
  date: string;
}) => {
  const parentRef = useRef<HTMLOListElement>(null);

  const observableVisibleItems = useVisibilityTracking({
    parentRef,
    listItemDataAttribute: "data-rev",
  });

  console.log([...selectedContentHashes].toSorted().join(" "));

  const countSelected = files.filter((f) =>
    selectedContentHashes.has(f.namedFile.content_hash),
  ).length;
  const countAll = files.length;

  const setAll = (which: "all" | "none", checked: boolean) => {
    if ((which === "all") === checked) {
      onSelectedContentHashes(
        new Set(files.map((f) => f.namedFile.content_hash)),
      );
    } else {
      onSelectedContentHashes(new Set());
    }
  };

  const [focusedRev, setFocusedRev] = useState<string>();

  return (
    <>
      <p>
        <input
          type="checkbox"
          disabled={countAll === 0}
          checked={countSelected === countAll}
          onChange={useMemo(() => (e) => setAll("all", e.target.checked), [])}
        />{" "}
        all
        <br />
        <input
          type="checkbox"
          disabled={countAll === 0}
          checked={countSelected === 0}
          onChange={useMemo(() => (e) => setAll("none", e.target.checked), [])}
        />{" "}
        none
      </p>

      <ol
        ref={parentRef}
        className="files"
        onKeyDown={(e) => {
          if (files.length === 0) return;
          if (!(!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey)) return;

          if (e.key === "j") {
            const idx = files.findIndex(
              (item) => item.namedFile.rev === focusedRev,
            );
            const newIndex = (idx + 1) % files.length;
            setFocusedRev(files[newIndex].namedFile.rev);
          }

          if (e.key === "k") {
            const idx = files.findIndex(
              (item) => item.namedFile.rev === focusedRev,
            );
            const newIndex = idx <= 0 ? files.length - 1 : idx - 1;
            setFocusedRev(files[newIndex].namedFile.rev);
          }

          if (e.key === "y" || e.key === "n") {
            const want = e.key === "y";

            const idx = files.findIndex(
              (item) => item.namedFile.rev === focusedRev,
            );
            const focusedFile: (typeof files)[number] | undefined = files[idx];

            if (
              focusedFile &&
              selectedContentHashes.has(focusedFile.namedFile.content_hash) !==
                want
            ) {
              const copy = new Set(selectedContentHashes);
              if (want) copy.add(focusedFile.namedFile.content_hash);
              else copy.delete(focusedFile.namedFile.content_hash);
              onSelectedContentHashes(copy);
            }

            const newIndex = (idx + 1) % files.length;
            setFocusedRev(files[newIndex].namedFile.rev);
          }

          if (e.key === "q") onSelectedContentHashes(new Set());
          if (e.key === "a")
            onSelectedContentHashes(
              new Set(files.map((f) => f.namedFile.content_hash)),
            );

          console.log({ key: e });
        }}
      >
        {observableVisibleItems &&
          files.map((f) => (
            <FileRow
              key={f.namedFile.id}
              file={f}
              focused={f.namedFile.rev === focusedRev}
              observableVisibleItems={observableVisibleItems}
              selected={selectedContentHashes.has(f.namedFile.content_hash)}
              onSelected={(selected) => {
                const t = new Set(selectedContentHashes);
                if (selected) t.add(f.namedFile.content_hash);
                else t.delete(f.namedFile.content_hash);

                onSelectedContentHashes(t);
                setFocusedRev(f.namedFile.rev);
              }}
              date={date}
            />
          ))}
      </ol>
    </>
  );
};

export default logRender(FilesTable);
