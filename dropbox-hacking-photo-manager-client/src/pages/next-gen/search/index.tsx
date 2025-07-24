import Navigate from "@components/navigate";
import { useLatestValueFromServerFeed } from "@hooks/useLatestValueFromServerFeed";
import logRender from "@lib/logRender";
import { parseFilterString } from "dropbox-hacking-photo-manager-shared";
import React, {
  type ChangeEventHandler,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ListOfFiles } from "../day/listOfFiles";

const NGSearch = ({
  filterText: initialFilterText,
}: {
  filterText?: string;
}) => {
  const [filterSource, setFilterSource] = useState(initialFilterText ?? "");

  const filter = useMemo(() => parseFilterString(filterSource), [filterSource]);

  const latestValue = useLatestValueFromServerFeed({
    type: "rx.ng.search",
    filter: filter ?? { type: "tag", tag: "" },
  });

  useEffect(() => {
    document.title = "DPMNG - search";
  }, []);

  const onFilterSourceChange = useMemo<ChangeEventHandler<HTMLInputElement>>(
    () => (e) => setFilterSource(e.target.value),
    [],
  );

  return (
    <>
      <Navigate />

      <h1>Search</h1>

      <p>The query is in Reverse Polish.</p>

      <ul>
        <li>tag=swan</li>
        <li>image / video / audio</li>
        <li>tags&gt;0 / tags&lt;2</li>
        <li>date&gt;2015 / date&lt;2019</li>
        <li>duration&gt;300 / duration&lt;10</li>
        <li>gps / !gps</li>
        <li>path~originals</li>
        <li>&, |, !</li>
      </ul>

      <input
        type="text"
        value={filterSource}
        onChange={onFilterSourceChange}
        style={{ width: "50em" }}
      />

      {filter ? (
        <p>{JSON.stringify(filter, null, 2)}</p>
      ) : (
        <p>Not valid filter</p>
      )}

      {latestValue ? (
        <>
          {latestValue.truncated && <p>Results are truncated</p>}

          <ListOfFiles files={latestValue.files} date={"2000-01-01"} />
        </>
      ) : (
        "loading..."
      )}
    </>
  );
};

export default logRender(NGSearch);
