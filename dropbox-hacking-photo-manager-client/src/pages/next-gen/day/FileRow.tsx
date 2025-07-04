import React, { useEffect, useMemo, useState } from "react";

import logRender from "@lib/logRender";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import SamePageLink from "@components/samePageLink";
import MaybeVisibleThumbnail from "./MaybeVisibleThumbnail";
import { Observable } from "rxjs";

const FileRow = ({
  file,
  focused,
  observableVisibleItems,
  selected,
  onSelected,
}: {
  file: DayFilesResult["files"][number];
  focused: boolean;
  observableVisibleItems: Observable<ReadonlySet<string>>;
  selected: boolean;
  onSelected: (selected: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sub = observableVisibleItems.subscribe((s) =>
      setVisible(s.has(file.namedFile.rev)),
    );
    return () => sub.unsubscribe();
  }, [observableVisibleItems, file]);

  return (
    <li
      key={file.namedFile.id}
      data-rev={file.namedFile.rev}
      className={`${selected ? "selected" : ""} ${focused ? "focused" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={useMemo(
          () => (e) => onSelected(e.target.checked),
          [onSelected],
        )}
      />
      <time className="mtime">
        {file.namedFile.client_modified.replace("T", " ")}
      </time>
      <div className="flags">
        {file.content.exif && "+exif "}
        {file.content.mediaInfo && "+mediainfo "}
      </div>
      <div className="fileext">
        {file.namedFile.name.split(".").pop()?.toLocaleLowerCase()}
      </div>
      <div className="basename">
        {file.namedFile.name
          .toLocaleLowerCase()
          .replaceAll(file.namedFile.content_hash, "#")}
      </div>
      <div className="thumbnail">
        <SamePageLink
          routeState={useMemo(
            () => ({
              route: "route/next-gen/content-hash",
              contentHash: file.namedFile.content_hash,
            }),
            [file.namedFile.content_hash],
          )}
        >
          <MaybeVisibleThumbnail namedFile={file.namedFile} visible={visible} />
        </SamePageLink>
      </div>
      <div className="description">{file.photoDbEntry?.description ?? ""}</div>
      <div className="tags">
        {(file.photoDbEntry?.tags ?? []).map((tag, index) => (
          <span key={index} className={`tag tag-${tag}`}>
            {tag}
          </span>
        ))}
      </div>
    </li>
  );
};

export default logRender(FileRow);
