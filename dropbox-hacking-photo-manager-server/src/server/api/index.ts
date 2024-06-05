import { Application } from "express-ws";

import { Context } from "../context";
import getCountsByDate from "./getCountsByDate";
import getEvents from "./getEvents";
import getLs from "./getLs";
import getPhotoMetadata from "./getPhotoMetadata";
import getPhotosOnDate from "./getPhotosOnDate";
import getSetDayMetadata from "./getSetDayMetadata";
import getThumbnailMulti from "./getThumbnailMulti";
import { route as getWs } from "./websocket";

export default (app: Application, context: Context): void => {
  getCountsByDate(app, context);
  getLs(app, context);
  getPhotosOnDate(app, context);
  getPhotoMetadata(app, context);
  getThumbnailMulti(app, context);
  getSetDayMetadata(app, context);
  getEvents(app, context);
  getWs(app, context);
};
