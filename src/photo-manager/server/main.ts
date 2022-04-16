import * as express from "express";
import * as path from "path";
import { ExifDB } from "../../components/exif/exifDB";
import * as LsCache from "../../components/lsCache";
import { CountsByDate, Photo, ThumbnailsByRev } from "../shared/types";
import { getDropboxClient } from "../../auth";
import ThumbnailResolver from "./thumbnailResolver";
import { files } from "dropbox";
import ThumbnailSize = files.ThumbnailSize;
import * as https from "https";
import GetThumbnailBatchArg = files.GetThumbnailBatchArg;

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

type ThumbnailSizeTag = ThumbnailSize[".tag"];

const thumbnailResolvers = new Map<
  ThumbnailSizeTag,
  Promise<ThumbnailResolver>
>();

const getThumbnailResolver = (
  sizeTag: ThumbnailSizeTag
): Promise<ThumbnailResolver> => {
  const r = thumbnailResolvers.get(sizeTag);
  if (r) return r;

  const promise = getDropboxClient().then(
    (dbx) => new ThumbnailResolver(dbx, { [".tag"]: sizeTag }, 200)
  );
  thumbnailResolvers.set(sizeTag, promise);
  return promise;
};

app.get("/api/thumbnail/128/rev/:rev", (req, res) =>
  getThumbnailResolver("w128h128")
    .then((thumbnailResolver) =>
      thumbnailResolver.getForPath(`rev:${req.params.rev}`)
    )
    .then((base64Thumbnail) => {
      const buffer = Buffer.from(base64Thumbnail, "base64");

      res.status(200);
      res.setHeader(
        "Expires",
        new Date(new Date().getTime() + 3600 * 1000).toUTCString()
      );
      res.setHeader("Cache-Control", "private; max-age=3600");
      res.contentType("image/jpeg");
      res.send(buffer);
    })
);

app.get("/api/thumbnail/128/revs/:revs", (req, res) =>
  getDropboxClient().then((dbx) => {
    const request: GetThumbnailBatchArg = {
      entries: req.params.revs.split(/,/).map((rev) => ({
        path: `rev:${rev}`,
        size: { [".tag"]: "w128h128" },
      })),
    };

    return dbx.filesGetThumbnailBatch(request).then((dbxRes) => {
      const answer: ThumbnailsByRev = {
        thumbnails_by_rev: [],
      };

      for (const e of dbxRes.result.entries) {
        if (e[".tag"] === "success") {
          answer.thumbnails_by_rev.push({
            rev: e.metadata.rev,
            thumbnail: e.thumbnail,
          });
        }
      }

      const expires = new Date(new Date().getTime() + 86400 * 1000);
      res.setHeader("Expires", expires.toUTCString());
      res.setHeader("Cache-Control", "private; max-age=86400");
      res.json(answer);
    });
  })
);

app.get("/api/thumbnail/640/rev/:rev", (req, res) =>
  getThumbnailResolver("w640h480")
    .then((thumbnailResolver) =>
      thumbnailResolver.getForPath(`rev:${req.params.rev}`)
    )
    .then((base64Thumbnail) => {
      const buffer = Buffer.from(base64Thumbnail, "base64");

      res.status(200);
      res.setHeader(
        "Expires",
        new Date(new Date().getTime() + 3600 * 1000).toUTCString()
      );
      res.setHeader("Cache-Control", "private; max-age=3600");
      res.contentType("image/jpeg");
      res.send(buffer);
    })
);

app.get("/api/photo/rev/:rev", (req, res) =>
  Promise.all([getLsState(), getExifDb()]).then(([state, exif]) => {
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

app.get("/image/rev/:rev", (req, res) =>
  getLsState().then((state) => {
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

    if (!file) {
      res.status(404);
      res.json({ error: `Photo not found` });
      return;
    }

    // const expirySeconds = 4 * 3600; // dbx docs
    // const expiresAt = new Date(new Date().getTime() + expirySeconds * 1000);

    return getDropboxClient()
      .then((dbx) => dbx.filesGetTemporaryLink({ path: `rev:${file.rev}` }))
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
              imageRes.headers["content-encoding"]
            );
          res.setHeader("Content-Disposition", "inline");

          imageRes.on("error", (err) => {
            console.error(err);
          });
          imageRes.pipe(res);
        });
      });
  })
);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
