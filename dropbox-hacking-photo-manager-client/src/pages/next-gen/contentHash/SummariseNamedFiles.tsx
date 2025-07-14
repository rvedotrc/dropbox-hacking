import SamePageLink from "@components/samePageLink";
import logRender from "@lib/logRender";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";
import React, { useId, useState } from "react";

const SummariseNamedFiles = ({
  namedFiles,
}: {
  namedFiles: readonly NamedFile[];
}) => {
  const [expandFull, setExpandFull] = useState(false);
  const checkboxId = useId();

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>mtime</th>
            <th>dirname</th>
            <th>basename</th>
          </tr>
        </thead>
        <tbody>
          {namedFiles.map((namedFile) => {
            const [date, time] = namedFile.client_modified.split("T");

            const lastSlash = namedFile.path_display.lastIndexOf("/");
            const dirname = namedFile.path_display.substring(0, lastSlash);
            const basename = namedFile.path_display.substring(lastSlash + 1);

            return (
              <tr key={namedFile.id}>
                <td>
                  <SamePageLink
                    routeState={{ route: "route/next-gen/day/files", date }}
                  >
                    {date}
                  </SamePageLink>{" "}
                  {time}
                </td>
                <td>
                  <a href={`https://www.dropbox.com/home${encodeURI(dirname)}`}>
                    {dirname}
                  </a>
                </td>
                <td>
                  <a
                    href={`https://www.dropbox.com/preview${encodeURI(namedFile.path_display)}?context=browse&role=personal`}
                  >
                    {basename.replaceAll(namedFile.content_hash, "#")}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p>
        <input
          id={checkboxId}
          type="checkbox"
          checked={expandFull}
          onChange={(e) => setExpandFull(e.currentTarget.checked)}
        />{" "}
        <label htmlFor={checkboxId}>Show full file data</label>
      </p>

      {expandFull && <pre>{JSON.stringify(namedFiles, null, 2)}</pre>}
    </>
  );
};

export default logRender(SummariseNamedFiles);
