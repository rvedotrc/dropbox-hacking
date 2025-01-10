import { Application } from "express";

import { Context } from "./context.js";

export default (app: Application, context: Context): void => {
  app.get("/", (_, res) => {
    res.redirect(302, `${context.baseUrlWithoutSlash}/calendar`);
  });
};
