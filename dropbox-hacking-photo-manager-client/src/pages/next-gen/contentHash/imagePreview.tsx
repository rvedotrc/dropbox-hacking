import logRender from "@lib/logRender";
import type { NamedFile } from "dropbox-hacking-photo-manager-shared";
import React from "react";

const ImagePreview = ({ namedFile }: { namedFile: NamedFile }) => (
  <div>
    <a href={`/image/rev/${namedFile.rev}`}>
      <img src={`/image/rev/${namedFile.rev}/w640h480`} alt={"preview"} />
    </a>
  </div>
);

export default logRender(ImagePreview);
