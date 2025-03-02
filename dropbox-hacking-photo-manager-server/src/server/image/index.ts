import { Application } from "express";

import { Context } from "../context.js";
import getFullImage from "./getFullImage.js";
import getPreview from "./getPreview.js";

export default (app: Application, context: Context): void => {
  getFullImage(app, context);
  getPreview(app, context);
};
