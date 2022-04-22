import { CountsByDateEntry, CountsByDateResponse } from "../shared/types";
import { Application } from "express";
import { Context } from "./context";
import GPSLatLong from "../shared/gpsLatLong";

export default (app: Application, context: Context): void => {
  app.get("/api/counts_by_date", (req, res) => {
    Promise.all([context.lsState, context.exifDbAll]).then(
      ([state, exifDb]) => {
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
          const tags = exifDb.get(entry.content_hash)?.exifData.tags;
          const gps = tags ? GPSLatLong.fromExifTags(tags) : null;

          const existing = dates.get(date) || {
            date,
            count: 0,
            countWithGps: 0,
          };
          dates.set(date, {
            date,
            count: existing.count + 1,
            countWithGps: existing.countWithGps + (gps !== null ? 1 : 0),
          });
        }

        const countsByDate = [...dates.values()].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        const maxAge = 300;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

        const r: CountsByDateResponse = { counts_by_date: countsByDate };
        res.json(r);
      }
    );
  });
};
