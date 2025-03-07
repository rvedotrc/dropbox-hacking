import { DayMetadataResponse } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

export default (app: Application, context: Context): void => {
  app.patch("/api/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
    const body = req.body as unknown as { description: unknown };

    if (typeof body["description"] === "string") {
      const description = body["description"];

      const r: DayMetadataResponse = {
        day_metadata: { date: req.params.date, description },
      };

      void context.dayDb.setDay(r.day_metadata).then(() => {
        res.json(r);
      });
    } else {
      res.status(400);
      res.json({ error: "No description" });
    }
  });
};
