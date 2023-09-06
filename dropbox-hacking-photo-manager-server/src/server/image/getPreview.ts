import { files } from "dropbox";
import { Application } from "express";

import { Context } from "../context";

const ALLOWED_SIZES = [
  "w32h32",
  "w64h64",
  "w128h128",
  "w256h256",
  "w480h320",
  "w640h480",
  "w960h640",
  "w1024h768",
  "w2048h1536",
];

export default (app: Application, context: Context): void => {
  app.get("/api/config/preview-sizes", (_, res) => {
    const maxAge = 86400;
    const expires = new Date(new Date().getTime() + maxAge * 1000);
    res.setHeader("Expires", expires.toUTCString());
    res.setHeader("Cache-Control", `private; max-age=${maxAge}`);
    res.json(ALLOWED_SIZES);
  });

  app.get("/image/rev/:rev/:size", (req, res) => {
    if (ALLOWED_SIZES.indexOf(req.params.size) < 0) {
      return Promise.resolve()
        .then(() => res.sendStatus(404))
        .then();
    }

    return context.dropboxClient.then((dbx) => {
      return dbx
        .filesGetThumbnailV2({
          resource: { ".tag": "path", path: `rev:${req.params.rev}` },
          size: { ".tag": req.params.size } as files.ThumbnailSize,
        })
        .then((dbxRes) => {
          // fileBinary doesn't seem to be exposed via the SDK
          const buffer = (dbxRes.result as { fileBinary: Buffer })[
            "fileBinary"
          ];

          res.status(200);

          const maxAge = 86400;
          const expires = new Date(new Date().getTime() + maxAge * 1000);
          res.setHeader("Expires", expires.toUTCString());
          res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

          res.contentType("image/jpeg");
          res.send(buffer);
        });
    });
  });
};
