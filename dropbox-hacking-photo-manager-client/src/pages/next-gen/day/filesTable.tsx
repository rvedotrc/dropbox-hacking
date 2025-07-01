import React, { useEffect, useRef, useState } from "react";

import logRender from "@lib/logRender";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import SamePageLink from "@components/samePageLink";
import useVisibilityTracking from "@pages/legacy/days/useVisibilityTracking";
import MaybeVisibleThumbnail from "./MaybeVisibleThumbnail";
import { Observable } from "rxjs";

const FileRow = ({
  file,
  observableVisibleItems,
}: {
  file: DayFilesResult["files"][number];
  observableVisibleItems: Observable<ReadonlySet<string>>;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sub = observableVisibleItems.subscribe((s) =>
      setVisible(s.has(file.namedFile.rev)),
    );
    return () => sub.unsubscribe();
  }, [observableVisibleItems, file]);

  return (
    <tr key={file.namedFile.id} data-rev={file.namedFile.rev}>
      <td>{file.namedFile.client_modified.replace("T", " ")}</td>
      <td>
        {file.content.exif && "+exif "}
        {file.content.mediaInfo && "+mediainfo "}
      </td>
      <td>{file.namedFile.name.split(".").pop()?.toLocaleLowerCase()}</td>
      <td>
        {file.namedFile.name
          .toLocaleLowerCase()
          .replaceAll(file.namedFile.content_hash, "#")}
      </td>
      <td>
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: file.namedFile.content_hash,
          }}
        >
          <MaybeVisibleThumbnail namedFile={file.namedFile} visible={visible} />
        </SamePageLink>
      </td>
      <td>
        <div>{file.photoDbEntry?.description ?? ""}</div>
        <div className="tags">
          {(file.photoDbEntry?.tags ?? []).map((tag, index) => (
            <span key={index} className={`tag tag-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
};

const LoggedFileRow = logRender(FileRow);

const FilesTable = ({ files }: { files: DayFilesResult["files"] }) => {
  const parentRef = useRef<HTMLTableSectionElement>(null);

  const observableVisibleItems = useVisibilityTracking({
    parentRef,
    listItemDataAttribute: "data-rev",
  });

  return (
    <table>
      <tbody ref={parentRef}>
        {observableVisibleItems &&
          files.map((f) => (
            <LoggedFileRow
              key={f.namedFile.id}
              file={f}
              observableVisibleItems={observableVisibleItems}
            />
          ))}
      </tbody>
    </table>
  );
};

export default logRender(FilesTable);
