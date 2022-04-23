import { Application } from "express";
import { Context } from "../context";

export default (app: Application, context: Context): void => {
  app.get("/image/rev/:rev/640", (req, res) =>
    context.dropboxClient.then((dbx) =>
      dbx
        .filesGetThumbnailV2({
          resource: { ".tag": "path", path: `rev:${req.params.rev}` },
          size: { ".tag": "w640h480" },
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
        })
    )
  );
};
