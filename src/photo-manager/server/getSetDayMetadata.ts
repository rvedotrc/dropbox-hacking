import { Application } from "express";
import { Context } from "./context";

export default (app: Application, context: Context): void => {
  app.get("/api/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) =>
    context.dayDb
      .then((dayDb) => dayDb.days)
      .then((days) => days.find((d) => d.date === req.params.date))
      .then((thisDay) => {
        if (thisDay === undefined)
          thisDay = { date: req.params.date, description: "" };

        res.json({ day_metadata: thisDay });
      })
  );

  app.patch("/api/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
    const body = req.body;

    if (typeof body["description"] === "string") {
      const description = body["description"];

      const r = { date: req.params.date, description };

      context.dayDb
        .then((dayDb) => dayDb.setDay(r))
        .then(() => {
          res.status(200);
          res.json({ day_metadata: r });
        });
    } else {
      res.status(400);
      res.json({ error: "No description" });
    }
  });
};
