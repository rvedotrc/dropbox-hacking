import { Photo, PhotosResponse } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

export default (app: Application, context: Context): void => {
  app.get("/api/photos/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
    const date = req.params.date;

    void Promise.all([context.lsFeed.read(), context.exifDbFeed.read()]).then(
      ([state, exif]) => {
        if (state.tag !== "ready") {
          res.status(503);
          res.json({ error: `ls cache not ready (${state.tag})` });
          return;
        }

        const photos: Photo[] = [];

        for (const entry of state.entries.values()) {
          if (entry[".tag"] !== "file") continue;
          if (!entry.path_lower?.endsWith(".jpg")) continue;

          if (!entry.content_hash) continue;

          const thisExif = exif.get(entry.content_hash);
          if (!thisExif) {
            console.log(
              `No exif data yet for ${entry.content_hash} (${entry.path_lower})`,
            );
            continue;
          }

          const thisDate = entry.client_modified.substring(0, 10);
          if (thisDate === date) photos.push({ ...entry, exif: thisExif });
        }

        photos.sort(
          (a, b) =>
            a.client_modified.localeCompare(b.client_modified) ||
            a.id.localeCompare(b.id),
        );

        const maxAge = 3600;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

        const r: PhotosResponse = { photos };
        res.json(r);
      },
    );
  });
};
