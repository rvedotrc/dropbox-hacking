import { Application } from "express";
import { Context } from "./context";
import { ThumbnailsByRev } from "../shared/types";
import { files } from "dropbox";
import GetThumbnailBatchArg = files.GetThumbnailBatchArg;

export default (app: Application, context: Context): void => {
  app.get("/api/thumbnail/128/revs/:revs", (req, res) =>
    context.dropboxClient.then((dbx) => {
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
};
