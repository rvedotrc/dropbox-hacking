import { files } from "dropbox";
import { Application } from "express";

import { Context } from "../context.js";

const ALLOWED_SIZES: files.ThumbnailSize[".tag"][] = [
  "w32h32",
  "w64h64",
  "w128h128",
  "w256h256",
  "w480h320",
  "w640h480",
  "w960h640",
  "w1024h768",
  "w2048h1536",
] as const;

const isValidSize = (size: string): size is files.ThumbnailSize[".tag"] =>
  (ALLOWED_SIZES as readonly string[]).includes(size);

export default (app: Application, context: Context): void => {
  app.get("/api/config/preview-sizes", (_, res) => {
    const maxAge = 86400;
    const expires = new Date(new Date().getTime() + maxAge * 1000);
    res.setHeader("Expires", expires.toUTCString());
    res.setHeader("Cache-Control", `private; max-age=${maxAge}`);
    res.json(ALLOWED_SIZES);
    res.end();
  });

  app.get("/image/rev/:rev/:size", async (req, res) => {
    const { rev, size } = req.params;

    if (!isValidSize(size)) {
      res.sendStatus(404);
      res.end();
      return;
    }

    context
      .thumbnailFetcher({ rev, size })
      .then((thumbnail) => {
        if (thumbnail === null) return res.sendStatus(404);

        const buffer = Buffer.from(thumbnail.base64JPEG, "base64");

        res.status(200);
        const maxAge = 86400;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);
        res.contentType("image/jpeg");
        res.send(buffer);
      })
      .catch((error) => {
        console.error(`GET ${req.path} exception:`, error);
        if (!res.headersSent) res.sendStatus(500);
      })
      .finally(() => res.end());
  });
};
