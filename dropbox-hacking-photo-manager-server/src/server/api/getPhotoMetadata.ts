import { files } from "dropbox";
import { Photo, PhotoResponse } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context";

export default (app: Application, context: Context): void => {
  app.get("/api/photo/rev/:rev", (req, res) =>
    Promise.all([context.lsFeed.read(), context.exifDbFeed.read()]).then(
      ([state, exif]) => {
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
        const exifData =
          file && file.content_hash ? exif.get(file.content_hash) : undefined;

        if (!file || !exifData) {
          res.status(404);
          res.json({ error: `Photo not found` });
          return;
        }

        const photo: Photo = { ...file, exif: exifData };

        const maxAge = 86400;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

        const r: PhotoResponse = { photo };
        res.json(r);
      },
    ),
  );
};
