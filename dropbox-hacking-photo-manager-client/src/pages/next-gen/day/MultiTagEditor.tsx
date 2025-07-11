import logRender from "@lib/logRender";
import type { DayFilesResult } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import React, { useMemo, useState } from "react";

const MultiTagEditor = ({
  contentHashes,
  files,
}: {
  contentHashes: ReadonlySet<string>;
  files: DayFilesResult["files"];
}) => {
  const initialState = useMemo(() => {
    const countsByTag = new Map<string, number>();

    for (const file of files) {
      for (const tag of file.photoDbEntry?.tags ?? []) {
        countsByTag.set(tag, (countsByTag.get(tag) ?? 0) + 1);
      }
    }

    return new Map(
      [...countsByTag.entries()].map(
        ([tag, count]) =>
          [tag, count === files.length ? "all" : "some"] as const,
      ),
    );
  }, [files]);

  const [text, setText] = useState(() =>
    [...initialState.entries()]
      .toSorted((a, b) => a[0].localeCompare(b[0]))
      .map((item) => (item[1] === "all" ? item[0] : `~${item[0]}`))
      .join(" "),
  );

  const newState = new Map(
    text
      .trim()
      .split(/\s+/g)
      .filter(Boolean)
      .map(
        (spec) =>
          [
            spec.startsWith("~") ? spec.substring(1) : spec,
            spec.startsWith("~") ? "some" : "all",
          ] as const,
      ),
  );

  const actionMap = {
    "all->all": "noop",
    "all->some": "invalid",
    "all->": "remove",
    "some->all": "add",
    "some->some": "noop",
    "some->": "remove",
    "->all": "add",
    "->some": "invalid",
  } as const;

  const allTags = [
    ...new Set([...initialState.keys(), ...newState.keys()]),
  ].toSorted();

  const tagActions = allTags.map((tag) => {
    const [was, now] = [initialState.get(tag), newState.get(tag)];
    const action =
      actionMap[`${was ?? ""}->${now ?? ""}` as keyof typeof actionMap];
    if (!action) throw new Error(`No action for ${was ?? ""}->${now ?? ""}`);

    return { tag, action };
  });

  const isSpecValid = !tagActions.some((item) => item.action === "invalid");

  const isChanged = tagActions.some(
    (item) => item.action !== "invalid" && item.action !== "noop",
  );

  const doUpdate = () => {
    const body = {
      contentHashes: [...contentHashes].toSorted(),
      tagActions: tagActions.filter((tagAction) => tagAction.action !== "noop"),
    };

    console.log(body);

    void fetch("/api/multi-photo-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  return (
    <div className="multiTagEditor">
      <div className="itemCount">
        editing {files.length === 1 ? "1 item" : `${files.length} items`}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isSpecValid) doUpdate();
        }}
      >
        Tags:{" "}
        <input
          style={{ backgroundColor: isSpecValid ? "#fff" : "#faa" }}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />{" "}
        <input
          type="submit"
          disabled={!isSpecValid || !isChanged}
          value="Save"
        />
      </form>
    </div>
  );
};

export default logRender(MultiTagEditor);
