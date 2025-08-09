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

const ALLOWED_MODES: files.ThumbnailMode[".tag"][] = [
  "bestfit",
  "fitone_bestfit",
  "strict",
] as const;

const ALLOWED_FORMATS: files.ThumbnailFormat[".tag"][] = [
  "jpeg",
  "png",
] as const;

const isValidSize = (size: string): size is files.ThumbnailSize[".tag"] =>
  (ALLOWED_SIZES as readonly string[]).includes(size);

const isValidMode = (mode: string): mode is files.ThumbnailMode[".tag"] =>
  (ALLOWED_MODES as readonly string[]).includes(mode);

const isValidFormat = (
  format: string,
): format is files.ThumbnailFormat[".tag"] =>
  (ALLOWED_FORMATS as readonly string[]).includes(format);

export default (app: Application, context: Context): void => {
  app.get("/api/config/preview-sizes", (_, res) => {
    const maxAge = 86400;
    const expires = new Date(new Date().getTime() + maxAge * 1000);
    res.setHeader("Expires", expires.toUTCString());
    res.setHeader("Cache-Control", `private; max-age=${maxAge}`);
    res.json(ALLOWED_SIZES);
    res.end();
  });

  app.get("/image/rev/:rev/:size/:mode/:format", async (req, res) => {
    const { rev, size, mode, format } = req.params;

    if (!isValidSize(size)) {
      res.sendStatus(404);
      res.end();
      return;
    }

    if (!isValidMode(mode)) {
      res.sendStatus(404);
      res.end();
      return;
    }

    if (!isValidFormat(format)) {
      res.sendStatus(404);
      res.end();
      return;
    }

    context
      .thumbnailFetcher({
        rev,
        size,
        mode,
        format,
      })
      .then((thumbnail) => {
        if (thumbnail === null) return res.sendStatus(404);

        const buffer = Buffer.from(thumbnail.base64JPEG, "base64");

        res.status(200);
        const maxAge = 86400;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);
        res.contentType(`image/${format}`);
        res.send(buffer);
      })
      .catch((error) => {
        console.error(`GET ${req.path} exception:`, error);
        if (!res.headersSent) res.sendStatus(500);
      })
      .finally(() => res.end());
  });
};
