import SamePageLink from "@components/samePageLink";
import logRender from "@lib/logRender";
import { GPSLatLong } from "dropbox-hacking-photo-manager-shared";
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

  const tags = file.content.exif?.exifData.tags;
  const generalTrack = file.content.mediaInfo?.mediainfoData.media?.track.find(
    (track) => track["@type"] === "General",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  const gps = tags
    ? GPSLatLong.fromExifTags(tags)
    : generalTrack?.Recorded_Location
      ? GPSLatLong.fromMediaInfoRecordedAt(generalTrack.Recorded_Location)
      : null;

  const make =
    file.content.exif?.exifData.tags?.Make ??
    generalTrack?.Encoded_Hardware_CompanyName ??
    "";
  const model =
    file.content.exif?.exifData.tags?.Model ??
    generalTrack?.Encoded_Hardware_Name ??
    "";
  const deviceIcon = /EX-Z3|FinePix HS10 HS11|Canon PowerShot SX70 HS/.test(
    model,
  )
    ? "/camera-icon.dark.svg"
    : /iPhone 4S|Pixel|Pixel 2|iPhone 12 mini/.test(model)
      ? "/mobile-phone.svg"
      : file.namedFile.name.toLocaleLowerCase().startsWith("dji")
        ? "/drone.svg"
        : null;

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

        {file.content.exif && <span>exif</span>}
        {file.content.mediaInfo && <span>mediainfo</span>}
      </div>
      <time className="mtime">
        {file.namedFile.client_modified.replace("T", " ")}
      </time>
      <div className={"makeAndModel"}>
        {make || "[none]"}{" "}
        {(model.startsWith(make)
          ? model.replace(make, "").trimStart()
          : model) || "[none]"}
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
              context: {
                date,
                rev: file.namedFile.rev,
              },
            }),
            [file.namedFile.content_hash, file.namedFile.rev, date],
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
