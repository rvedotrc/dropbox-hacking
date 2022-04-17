import { Photo } from "../shared/types";
import { Application } from "express";
import { Context } from "./context";
import { files } from "dropbox";

export default (app: Application, context: Context): void => {
  app.get("/api/photo/rev/:rev", (req, res) =>
    Promise.all([context.lsState, context.exifDbAll]).then(([state, exif]) => {
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
      res.setHeader(
        "Expires",
        new Date(new Date().getTime() + 3600 * 1000).toUTCString()
      );
      res.setHeader("Cache-Control", "private; max-age=3600");
      res.json({ photo });
    })
  );
};
