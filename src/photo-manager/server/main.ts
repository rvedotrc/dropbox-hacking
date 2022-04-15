import * as express from "express";
import * as path from "path";
import { ExifDB } from "../../components/exif/exifDB";
import * as LsCache from "../../components/lsCache";
import { CountsByDate } from "../shared/types";

const app = express();

const exifDbDir = process.env.EXIF_DB_DIR;
if (exifDbDir === undefined) throw "Need EXIF_DB_DIR";

const lsCacheDir = process.env.LS_CACHE_DIR;
if (lsCacheDir === undefined) throw "Need LS_CACHE_DIR";

app.use(
  express.static(path.join(__dirname, "../../../photo-manager-client/public"))
);

app.get("/api/foo", (req, res) => {
  res.setHeader("Cache-Control", "private; max-age=10");
  res.json({ hello: "there", query: req.query });
});

app.get("/api/counts_by_date", (req, res) => {
  const exifDb = new ExifDB(exifDbDir);
  exifDb.readAll();

  const lsCache = new LsCache.StateDir(lsCacheDir);

  lsCache.load().then(() => {
    lsCache.getState().then((state) => {
      if (state.tag !== "ready") {
        res.status(503);
        res.json({ error: `ls cache not ready (${state.tag})` });
        return;
      }

      const dates = new Map<string, number>();
      for (const entry of state.entries.values()) {
        if (entry[".tag"] !== "file") continue;
        if (!entry.path_lower?.endsWith(".jpg")) continue;

        const date = entry.client_modified.substring(0, 10);
        dates.set(date, (dates.get(date) || 0) + 1);
      }

      const countsByDate: CountsByDate = [...dates.keys()]
        .sort()
        .map((date) => ({ date, count: dates.get(date) || 0 }));

      res.json({ counts_by_date: countsByDate });
    });
  });
});

app.listen(4000, () => {
  console.log("listening on port 4000");
});
