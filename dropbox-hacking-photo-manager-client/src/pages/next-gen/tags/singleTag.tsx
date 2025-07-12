import Navigate from "@components/navigate";
import logRender from "@lib/logRender";
import React, { useEffect } from "react";

const SingleTag = ({ tag }: { tag: string }) => {
  useEffect(() => {
    document.title = `DPMNG - '${tag}'`;
  }, []);

  return (
    <>
      <Navigate />

      <h1>'{tag}'</h1>
    </>
  );
};

export default logRender(SingleTag);
