import { Application } from "express";

import { Context } from "../context";
import getFullImage from "./getFullImage";
import getPreview from "./getPreview";

export default (app: Application, context: Context): void => {
  getFullImage(app, context);
  getPreview(app, context);
};
