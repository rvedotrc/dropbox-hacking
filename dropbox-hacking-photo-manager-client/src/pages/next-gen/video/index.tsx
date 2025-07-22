import Navigate from "@components/navigate";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import { useStyleSheet } from "@hooks/useStyleSheet";
import generateId from "@lib/generateId";
import logRender from "@lib/logRender";
import type { VideoResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { VideoRow } from "./VideoRow";

let _: VideoResult;

type Sorter = (a: VideoResult[number], b: VideoResult[number]) => number;

const availableSortBy = ["time", "duration"] as const;
const sorters: Record<(typeof availableSortBy)[number], Sorter> = {
  time: (a, b) =>
    a.namedFile.client_modified.localeCompare(b.namedFile.client_modified) ||
    a.namedFile.rev.localeCompare(b.namedFile.rev),
  duration: (a, b) =>
    (a.mediaInfoSummary.general?.duration ?? 0) -
      (b.mediaInfoSummary.general?.duration ?? 0) || sorters.time(a, b),
};

const Video = () => {
  console.log(`Video start`);

  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.video",
  });

  const [sortBy, setSortBy] = useState<(typeof availableSortBy)[number]>(
    availableSortBy[0],
  );

  const sorter: Sorter = useMemo(() => sorters[sortBy], [sortBy]);

  const sorted = useMemo(() => {
    console.log(`Sorting by ${sorter.toString()}`);
    const out = latestValue?.toSorted(sorter);
    console.log(`Sorting complete`);
    return out;
  }, [latestValue, sorter]);

  useEffect(() => {
    document.title = "DPMNG - video";
  }, []);

  const onChange = useMemo(
    () => (e: ChangeEvent<HTMLInputElement>) =>
      setSortBy(e.target.value as typeof sortBy),
    [],
  );

  console.log(`Creating tree`);

  const tableId = useMemo(
    () => "X_" + crypto.randomUUID().replaceAll(/-/g, "_"),
    [],
  );

  useStyleSheet({
    cssText: `
      #${tableId} {
        font-size: 75%;
        margin: 1em;
      }

      #${tableId} th {
        rotate: -72deg;
      }

      #${tableId} tr:nth-child(2n) {
        background-color: #333;
      }

      #${tableId} td {
        white-space: pre;
      }

      #${tableId} .dayDescription,
      #${tableId} .photoDescription,
      #${tableId} .photoTags {
        max-width: 10vw;
        overflow: scroll;
      }

      #${tableId} td.duration {
        font-family: monospace;
        text-align: end;
      }
    `,
  });

  const tree = (
    <>
      <Navigate />

      <h1>Video</h1>

      <form>
        <p>
          <input
            type="radio"
            name="sort"
            value="time"
            checked={sortBy === "time"}
            onChange={onChange}
          />{" "}
          Time
          {" / "}
          <input
            type="radio"
            name="sort"
            value="duration"
            checked={sortBy === "duration"}
            onChange={onChange}
          />{" "}
          Duration
        </p>
      </form>

      {sorted ? (
        // It's faster to make a whole new table every time than it is to diff and update
        <table key={generateId()} id={tableId}>
          <thead>
            <tr>
              <th>date</th>
              <th>day text</th>
              <th>photo text</th>
              <th>photo tags</th>
              <th>GPS</th>
              <th>link</th>
              <th>container duration (seconds)</th>
              <th>container format</th>
              <th>container codec</th>
              <th>video format</th>
              <th>video codec</th>
              <th>video frame size</th>
              <th>video aspect ratio</th>
              <th>audio format</th>
              <th>audio codec</th>
              <th>audio channels</th>
              <th>audio sampling frequency</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <VideoRow key={item.namedFile.rev} item={item} />
            ))}
          </tbody>
        </table>
      ) : (
        "loading..."
      )}
    </>
  );

  console.log(`Tree complete`);
  useEffect(() => {
    console.log("effect running");
  });

  return tree;
};

export default logRender(Video);
