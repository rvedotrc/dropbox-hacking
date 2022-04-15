import * as express from "express";
import * as path from "path";
import { ExifDB } from "../../components/exif/exifDB";
import * as LsCache from "../../components/lsCache";
import { CountsByDate, Photo } from "../shared/types";
import { getDropboxClient } from "../../auth";
import ThumbnailResolver from "./thumbnailResolver";

const app = express();

const exifDbDir = process.env.EXIF_DB_DIR;
if (exifDbDir === undefined) throw "Need EXIF_DB_DIR";

const lsCacheDir = process.env.LS_CACHE_DIR;
if (lsCacheDir === undefined) throw "Need LS_CACHE_DIR";

const lsCache = new LsCache.StateDir(lsCacheDir);
const lsState = lsCache.load().then(() => lsCache.getState());
const getLsState: () => ReturnType<LsCache.StateDir["getState"]> = () =>
  lsState;

const exifDb = new ExifDB(exifDbDir);
const exifAll = exifDb.readAll();
const getExifDb: () => ReturnType<ExifDB["readAll"]> = () => exifAll;

app.use(
  express.static(path.join(__dirname, "../../../photo-manager-client/public"))
);

app.get("/api/foo", (req, res) => {
  res.setHeader("Cache-Control", "private; max-age=10");
  res.json({ hello: "there", query: req.query });
});

app.get("/api/counts_by_date", (req, res) => {
  getLsState().then((state) => {
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

    res.setHeader("Cache-Control", "private; max-age=10");
    res.json({ counts_by_date: countsByDate });
  });
});

app.get("/api/photos/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
  const date = req.params.date;

  Promise.all([getLsState(), getExifDb()]).then(([state, exif]) => {
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
      if (!thisExif) return;

      const thisDate = entry.client_modified.substring(0, 10);
      if (thisDate === date) photos.push({ ...entry, exif: thisExif });
    }

    photos.sort(
      (a, b) =>
        a.client_modified.localeCompare(b.client_modified) ||
        a.id.localeCompare(b.id)
    );

    res.setHeader("Cache-Control", "private; max-age=10");
    res.json({ photos });
  });
});

let thumbnailResolver128: ThumbnailResolver | undefined;
getDropboxClient().then(
  (dbx) =>
    (thumbnailResolver128 = new ThumbnailResolver(
      dbx,
      { ".tag": "w128h128" },
      200
    ))
);

app.get("/api/thumbnail/128/rev/:rev", (req, res) => {
  // Ugh
  thumbnailResolver128
    ?.getForPath(`rev:${req.params.rev}`)
    .then((base64Thumbnail) => {
      const buffer = Buffer.from(base64Thumbnail, "base64");

      res.status(200);
      res.setHeader("Cache-Control", "private; max-age=60");
      res.contentType("image/jpeg");
      res.send(buffer);
    });
});

app.listen(4000, () => {
  console.log("listening on port 4000");
});
