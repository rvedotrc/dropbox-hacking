import { Application } from "express";
import { Context } from "../context";
import getCountsByDate from "./getCountsByDate";
import getPhotosOnDate from "./getPhotosOnDate";
import getPhotoMetadata from "./getPhotoMetadata";
import getThumbnailMulti from "./getThumbnailMulti";
import getSetDayMetadata from "./getSetDayMetadata";

export default (app: Application, context: Context): void => {
  getCountsByDate(app, context);
  getPhotosOnDate(app, context);
  getPhotoMetadata(app, context);
  getThumbnailMulti(app, context);
  getSetDayMetadata(app, context);
};
