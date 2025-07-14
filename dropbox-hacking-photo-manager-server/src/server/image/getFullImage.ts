import { Application } from "express";
import * as https from "https";
import { map } from "rxjs";

import { Context } from "../context.js";

const revExistsBuilder =
  (context: Context) =>
  (rev: string): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      const obs = context.fullDatabaseFeeds.allFilesByRev.pipe(
        map((files) => files.has(rev)),
      );
      const subscription = obs.subscribe((exists) => {
        resolve(exists);
        process.nextTick(() => subscription.unsubscribe());
      });
    });

export default (app: Application, context: Context): void => {
  const revExists = revExistsBuilder(context);

  app.get("/image/rev/:rev", (req, res) =>
    Promise.all([revExists(req.params.rev), context.dropboxClient]).then(
      ([exists, dbx]) => {
        if (!exists) {
          res.status(404);
          res.json({ error: `Photo not found` });
          return;
        }

        // const expirySeconds = 4 * 3600; // dbx docs
        // const expiresAt = new Date(new Date().getTime() + expirySeconds * 1000);

        return dbx
          .filesGetTemporaryLink({ path: `rev:${req.params.rev}` })
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
                  imageRes.headers["content-encoding"],
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
      },
    ),
  );
};
