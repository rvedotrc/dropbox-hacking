import logRender from "@lib/logRender";
import { selectGPS } from "dropbox-hacking-photo-manager-shared";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { useEffect, useMemo, useState } from "react";
import { Observable } from "rxjs";

import MaybeVisibleThumbnail from "./MaybeVisibleThumbnail";

const FileRow = ({
  file,
  focused,
  observableVisibleItems,
  selected,
  onSelected,
  date,
}: {
  file: DayFilesResult["files"][number];
  focused: boolean;
  observableVisibleItems: Observable<ReadonlySet<string>>;
  selected: boolean;
  onSelected: (selected: boolean) => void;
  date: string;
}) => {
  const [visible, setVisible] = useState(false);

  const gps = selectGPS(file.photo, file.exif, file.mediaInfo);

  const generalTrack = file.mediaInfo?.mediainfoData.media?.track.find(
    (track) => track["@type"] === "General",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  const make =
    file.exif?.exifData.tags?.Make ??
    generalTrack?.Encoded_Hardware_CompanyName ??
    "";
  const model =
    file.exif?.exifData.tags?.Model ??
    generalTrack?.Encoded_Hardware_Name ??
    "";
  const deviceIcon = /EX-Z3|FinePix HS10 HS11|Canon PowerShot SX70 HS/.test(
    model,
  )
    ? "/camera-icon.dark.svg"
    : /iPhone 4S|Pixel|Pixel 2|iPhone 12 mini/.test(model)
      ? "/mobile-phone.svg"
      : file.namedFiles[0].name.toLocaleLowerCase().startsWith("dji")
        ? "/drone.svg"
        : null;

  useEffect(() => {
    const sub = observableVisibleItems.subscribe((s) =>
      setVisible(s.has(file.contentHash)),
    );
    return () => sub.unsubscribe();
  }, [observableVisibleItems, file]);

  return (
    <li
      key={file.contentHash}
      data-rev={file.contentHash}
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
      <div className="icons">
        {gps && (
          <img
            src="/gps-pin.dark.svg"
            style={{ width: "1em", height: "2em" }}
          />
        )}

        {deviceIcon && (
          <img src={deviceIcon} style={{ width: "2em", height: "2em" }} />
        )}

        {file.exif && <span>exif</span>}
        {file.mediaInfo && <span>mediainfo</span>}
      </div>
      <time className="mtime">{file.timestamp.replace("T", " ")}</time>
      <div className={"makeAndModel"}>
        {make || "[none]"}{" "}
        {(model.startsWith(make)
          ? model.replace(make, "").trimStart()
          : model) || "[none]"}
      </div>
      <div className="basename">
        {file.namedFiles[0].name
          .toLocaleLowerCase()
          .replaceAll(file.contentHash, "#")}
      </div>
      <div className="thumbnail">
        <MaybeVisibleThumbnail
          namedFile={file.namedFiles[0]}
          visible={visible}
          photo={file.photo ?? {}}
          routeState={useMemo(
            () => ({
              route: "route/next-gen/content-hash",
              contentHash: file.contentHash,
              context: {
                date,
                contentHash: file.contentHash,
              },
            }),
            [file.contentHash, date],
          )}
        />
      </div>
      <div className="description">{file.photo?.description ?? ""}</div>
      <div className="tags">
        {(file.photo?.tags ?? []).map((tag, index) => (
          <span key={index} className={`tag tag-${tag}`}>
            {tag}
          </span>
        ))}
      </div>
    </li>
  );
};

export default logRender(FileRow);
