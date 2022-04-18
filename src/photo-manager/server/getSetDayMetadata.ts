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
    console.log({ req });
    const body = req.body;
    console.log({ body });

    res.send("todo");
  });
};
