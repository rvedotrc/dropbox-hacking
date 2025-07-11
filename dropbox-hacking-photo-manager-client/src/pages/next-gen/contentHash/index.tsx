import React, { useEffect } from "react";

import logRender from "@lib/logRender";
import Navigate from "@components/navigate";
import {
  DayFilesResult,
  type ContentHashResult,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import SummariseMediaInfo from "./SummariseMediaInfo";
import SummariseExif from "./SummariseExif";
import SummariseNamedFiles from "./SummariseNamedFiles";
import ImagePreview from "./imagePreview";
import EditablePhotoEntry from "./EditablePhotoEntry";
import SamePageLink from "@components/samePageLink";

const Results = ({
  contentHash,
  latestValue,
}: {
  contentHash: string;
  latestValue: ContentHashResult;
}) => {
  return (
    <>
      <ImagePreview namedFile={latestValue.namedFiles[0]} />

      <EditablePhotoEntry
        contentHash={contentHash}
        photoDbEntry={latestValue.photoDbEntry}
      />

      <h2>Files</h2>

      <SummariseNamedFiles namedFiles={latestValue.namedFiles} />

      <h2>Exif</h2>

      {latestValue.exif !== null ? (
        <SummariseExif exif={latestValue.exif} />
      ) : (
        <p>none</p>
      )}

      <h2>MediaInfo</h2>

      {latestValue.mediainfo !== null ? (
        <SummariseMediaInfo mediaInfo={latestValue.mediainfo} />
      ) : (
        <p>none</p>
      )}
    </>
  );
};

const PrevNextFileNav = ({
  context,
}: {
  context: { date: string; rev: string };
}) => {
  const dayFiles = useLatestValueFromServerFeed<DayFilesResult>({
    type: "rx.ng.day.files",
    date: context.date,
  });

  const indexOfThisFile = dayFiles?.files.findIndex(
    (f) => f.namedFile.rev === context.rev,
  );

  const previousFile =
    dayFiles && indexOfThisFile !== undefined && indexOfThisFile > 0
      ? dayFiles.files[indexOfThisFile - 1]
      : undefined;
  const nextFile =
    dayFiles &&
    indexOfThisFile !== undefined &&
    indexOfThisFile + 1 < dayFiles.files.length
      ? dayFiles.files[indexOfThisFile + 1]
      : undefined;

  if (!previousFile && !nextFile) return;

  return (
    <div>
      {previousFile && (
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: previousFile.namedFile.content_hash,
            context: {
              date: context.date,
              rev: previousFile.namedFile.rev,
            },
          }}
        >
          &larr; {previousFile.namedFile.name}
        </SamePageLink>
      )}
      {" ~ "}
      <SamePageLink
        routeState={{
          route: "route/next-gen/day/files",
          date: context.date,
        }}
      >
        &uarr; {context.date} &uarr;
      </SamePageLink>
      {" ~ "}
      {nextFile && (
        <SamePageLink
          routeState={{
            route: "route/next-gen/content-hash",
            contentHash: nextFile.namedFile.content_hash,
            context: {
              date: context.date,
              rev: nextFile.namedFile.rev,
            },
          }}
        >
          {nextFile.namedFile.name} &rarr;
        </SamePageLink>
      )}
    </div>
  );
};

const NGContentHash = ({
  contentHash,
  context,
}: {
  contentHash: string;
  context?: { date: string; rev: string };
}) => {
  const latestValue = useLatestValueFromServerFeed<ContentHashResult>({
    type: "rx.ng.content_hash",
    contentHash,
  });

  useEffect(() => {
    document.title = "DPMNG - Content hash";
  }, []);

  return (
    <>
      <Navigate />

      {context && (
        <PrevNextFileNav
          key={`${context.date} ${context.rev}`}
          context={context}
        />
      )}

      <h1>Content hash {contentHash.substring(0, 10)}</h1>

      {latestValue ? (
        <Results contentHash={contentHash} latestValue={latestValue} />
      ) : (
        "Loading..."
      )}
    </>
  );
};

export default logRender(NGContentHash);
