import { Application } from "express-ws";

import { Context } from "../context.js";
import getCountsByDate from "./getCountsByDate.js";
import getEvents from "./getEvents.js";
import getLs from "./getLs.js";
import getPhotoMetadata from "./getPhotoMetadata.js";
import getPhotosOnDate from "./getPhotosOnDate.js";
import getSetDayMetadata from "./getSetDayMetadata.js";
import getThumbnailMulti from "./getThumbnailMulti.js";
import { route as getWs } from "./websocket/index.js";
import multiplexedWebSocket from "./multiplexedWebSocket/index.js";

export default (app: Application, context: Context): void => {
  getCountsByDate(app, context);
  getLs(app, context);
  getPhotosOnDate(app, context);
  getPhotoMetadata(app, context);
  getThumbnailMulti(app, context);
  getSetDayMetadata(app, context);
  getEvents(app, context);
  getWs(app, context);
  multiplexedWebSocket(app, context);
};
