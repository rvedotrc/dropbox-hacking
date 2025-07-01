import React, { useEffect } from "react";

import logRender from "@/logRender";
import Navigate from "@/days/navigate";
import { useLatestValueFromServerFeed } from "../useLatestValueFromServerFeed";
import type { ExifExplorerType } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

type Counts = ExifExplorerType["tagCounts"][number][1];
type Entry = [string, Counts];
type EntrySorter = (a: Entry, b: Entry) => number;

const ExifExplorer = () => {
  const latestValue = useLatestValueFromServerFeed<ExifExplorerType>({
    type: "rx.ng.exif-explorer",
  });

  useEffect(() => {
    document.title = "DPMNG - EXIF Explorer";
  }, []);

  const byName: EntrySorter = (a, b) => a[0].localeCompare(b[0]);
  // const byPresent: EntrySorter = (a, b) =>
  //   b[1].present - a[1].present || byName(a, b);
  const byNonBlank: EntrySorter = (a, b) =>
    b[1].nonBlank - a[1].nonBlank || byName(a, b);

  const sortedTagCounts =
    latestValue && latestValue.tagCounts?.toSorted(byNonBlank);

  return (
    <>
      <Navigate />

      <h1>EXIF Explorer</h1>

      {sortedTagCounts && (
        <table>
          <thead>
            <tr>
              <th>Tag</th>
              <th>present</th>
              <th>non-blank</th>
              <th>present % of all</th>
              <th>non-blank % of all</th>
              <th>non-blank % of present</th>
            </tr>
          </thead>
          <tbody>
            {sortedTagCounts.map(([tag, counts]) => (
              <tr key={tag}>
                <td>{tag}</td>
                <td>{counts.present}</td>
                <td>{counts.nonBlank}</td>
                <td>{(counts.present / latestValue.entries) * 100.0}</td>
                <td>{(counts.nonBlank / latestValue.entries) * 100.0}</td>
                <td>{(counts.nonBlank / counts.present) * 100.0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {latestValue ? (
        <pre>{JSON.stringify(latestValue ?? null, null, 2)}</pre>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(ExifExplorer);
