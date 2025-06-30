import { type PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

export default (app: Application, context: Context): void => {
  app.patch("/api/photo/content_hash/:content_hash", async (req, res) => {
    const body = req.body as unknown as PhotoDbEntry;
    await context.photoRxUpdater({
      contentHash: req.params.content_hash,
      entry: body,
    });

    res.status(204);
    res.end();
  });
};
