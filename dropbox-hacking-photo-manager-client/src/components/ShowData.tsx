import logRender from "@lib/logRender";
import React, { useId, useState } from "react";

const ShowData = ({ data }: { data: unknown }) => {
  const [expandFull, setExpandFull] = useState(false);
  const checkboxId = useId();

  return (
    <>
      <p>
        <input
          id={checkboxId}
          type="checkbox"
          checked={expandFull}
          onChange={(e) => setExpandFull(e.currentTarget.checked)}
        />{" "}
        <label htmlFor={checkboxId}>Show full data</label>
      </p>

      {expandFull && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </>
  );
};

export default logRender(ShowData);
