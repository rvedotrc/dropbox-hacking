import { Application } from "express";
import { Context } from "./context";
import * as https from "https";
import { files } from "dropbox";

export default (app: Application, context: Context): void => {
  app.get("/image/rev/:rev", (req, res) =>
    Promise.all([context.lsState, context.dropboxClient]).then(
      ([state, dbx]) => {
        if (state.tag !== "ready") {
          res.status(503);
          res.json({ error: `ls cache not ready (${state.tag})` });
          return;
        }

        const findPhoto = (rev: string): files.FileMetadataReference | null => {
          for (const metadata of state.entries.values()) {
            if (metadata[".tag"] === "file" && metadata.rev === rev)
              return metadata;
          }

          return null;
        };

        const file = findPhoto(req.params.rev);

        if (!file) {
          res.status(404);
          res.json({ error: `Photo not found` });
          return;
        }

        // const expirySeconds = 4 * 3600; // dbx docs
        // const expiresAt = new Date(new Date().getTime() + expirySeconds * 1000);

        return dbx
          .filesGetTemporaryLink({ path: `rev:${file.rev}` })
          .then((r) => r.result.link)
          .then((url) => {
            https.get(url, {}, (imageRes) => {
              if (imageRes.statusCode !== 200) {
                res.status(500);
                res.json({ error: `Expected 200 got ${imageRes.statusCode}` });
                return;
              }

              res.status(200);
              if (imageRes.headers["content-type"])
                res.contentType(imageRes.headers["content-type"]);
              if (imageRes.headers["content-encoding"])
                res.setHeader(
                  "Content-Encoding",
                  imageRes.headers["content-encoding"]
                );
              res.setHeader("Content-Disposition", "inline");

              const maxAge = 86400;
              const expires = new Date(new Date().getTime() + maxAge * 1000);
              res.setHeader("Expires", expires.toUTCString());
              res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

              imageRes.on("error", (err) => {
                console.error(err);
              });
              imageRes.pipe(res);
            });
          });
      }
    )
  );
};
