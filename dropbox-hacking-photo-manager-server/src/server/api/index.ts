import { Application } from "express";

import { Context } from "../context";
import getCountsByDate from "./getCountsByDate";
import getPhotoMetadata from "./getPhotoMetadata";
import getPhotosOnDate from "./getPhotosOnDate";
import getSetDayMetadata from "./getSetDayMetadata";
import getThumbnailMulti from "./getThumbnailMulti";

export default (app: Application, context: Context): void => {
  getCountsByDate(app, context);
  getPhotosOnDate(app, context);
  getPhotoMetadata(app, context);
  getThumbnailMulti(app, context);
  getSetDayMetadata(app, context);
};
