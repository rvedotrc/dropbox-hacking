import { Application } from "express";
import { Context } from "./context";

export default (app: Application, context: Context): void => {
  app.get("/api/thumbnail/640/rev/:rev", (req, res) =>
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
          res.setHeader(
            "Expires",
            new Date(new Date().getTime() + 3600 * 1000).toUTCString()
          );
          res.setHeader("Cache-Control", "private; max-age=3600");
          res.contentType("image/jpeg");
          res.send(buffer);
        })
    )
  );
};
