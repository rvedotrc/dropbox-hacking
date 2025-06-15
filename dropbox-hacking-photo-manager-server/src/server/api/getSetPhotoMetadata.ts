import { type PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

export default (app: Application, context: Context): void => {
  app.patch("/api/photo/rev/:rev", async (req, res) => {
    const body = req.body as unknown as PhotoDbEntry;
    await context.photoRxUpdater(req.params.rev, body);

    res.status(204);
    res.end();
  });
};
