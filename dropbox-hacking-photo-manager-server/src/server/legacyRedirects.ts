import { Application } from "express";

import { Context } from "./context";

export default (app: Application, context: Context): void => {
  app.get("/photo.html", (req, res) => {
    const rev = req.query.rev;

    if (typeof rev === "string") {
      return res.redirect(
        301,
        `${context.baseUrlWithoutSlash}/photo/rev/${rev}`,
      );
    }

    res.sendStatus(404);
  });

  app.get("/day.html", (req, res) => {
    const date = req.query.date;

    if (typeof date === "string" && date.match(/^\d\d\d\d-\d\d-\d\d$/)) {
      return res.redirect(301, `${context.baseUrlWithoutSlash}/day/${date}`);
    }

    res.sendStatus(404);
  });
};
