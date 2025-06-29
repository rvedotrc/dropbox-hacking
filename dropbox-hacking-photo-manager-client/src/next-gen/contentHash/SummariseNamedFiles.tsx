import type { NamedFile } from "dropbox-hacking-photo-manager-shared";
import logRender from "../../logRender";
import React, { useId, useState } from "react";
import SamePageLink from "../../samePageLink";

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
            <th>rev</th>
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
                  <SamePageLink routeState={{ route: "day", date }}>
                    [old]
                  </SamePageLink>{" "}
                  <SamePageLink
                    routeState={{ route: "route/next-gen/day/files", date }}
                  >
                    {date}
                  </SamePageLink>{" "}
                  {time}
                </td>
                <td>
                  <SamePageLink
                    routeState={{
                      route: "photo",
                      rev: namedFile.rev,
                    }}
                  >
                    [old]
                  </SamePageLink>
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
                    {basename.replaceAll(namedFile.content_hash, "HASH")}
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
