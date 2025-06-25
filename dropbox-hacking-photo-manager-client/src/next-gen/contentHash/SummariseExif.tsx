import React from "react";
import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import logRender from "../../logRender";

const SummariseExif = ({ exif }: { exif: ExifFromHash }) => {
  return (
    <>
      <pre>{JSON.stringify(exif, null, 2)}</pre>
    </>
  );
};

export default logRender(SummariseExif);
