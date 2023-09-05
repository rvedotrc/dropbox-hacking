import { Application } from "express";
import { Context } from "../context";
import getPreview from "./getPreview";
import getFullImage from "./getFullImage";

export default (app: Application, context: Context): void => {
  getFullImage(app, context);
  getPreview(app, context);
};
