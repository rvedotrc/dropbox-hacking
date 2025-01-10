import {
  CountsByDateEntry,
  CountsByDateResponse,
  GPSLatLong,
  Photo,
} from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

const samplePhotos = (photos: Photo[]): Photo[] => {
  if (photos.length === 0) return photos;

  photos = [...photos];
  let n = Math.ceil(Math.log(photos.length) / Math.log(2.0));
  if (n < 1) n = 1;

  return [...new Array(n).keys()].map(() => {
    const i = Math.floor(Math.random() * photos.length);
    return photos.splice(i, 1)[0];
  });
};

export default (app: Application, context: Context): void => {
  app.get("/api/counts_by_date", (_req, res) => {
    Promise.all([context.lsFeed.read(), context.exifDbFeed.read()])
      .then(([state, exifDb]) => {
        if (state.tag !== "ready") {
          res.status(503);
          res.json({ error: `ls cache not ready (${state.tag})` });
          return;
        }

        const dates = new Map<string, CountsByDateEntry>();
        for (const entry of state.entries.values()) {
          if (entry[".tag"] !== "file") continue;
          if (!entry.content_hash) continue;
          if (!entry.path_lower?.endsWith(".jpg")) continue;

          const date = entry.client_modified.substring(0, 10);
          const exif = exifDb.get(entry.content_hash);
          if (!exif) continue;

          const tags = exif.exifData.tags;
          const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

          const existing = dates.get(date) || {
            date,
            count: 0,
            countWithGps: 0,
            samplePhotos: [],
          };
          dates.set(date, {
            date,
            count: existing.count + 1,
            countWithGps: existing.countWithGps + (gps !== null ? 1 : 0),
            samplePhotos: [...existing.samplePhotos, { ...entry, exif }],
          });
        }

        const countsByDate = [...dates.values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        );

        for (const d of countsByDate) {
          d.samplePhotos = samplePhotos(d.samplePhotos);
        }

        const maxAge = 300;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

        const r: CountsByDateResponse = { counts_by_date: countsByDate };
        res.json(r);
      })
      .catch((err) => {
        console.error("ERROR in /api/counts_by_date: ", err);
      });
  });
};
