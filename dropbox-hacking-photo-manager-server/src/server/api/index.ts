import { Application } from "express-ws";

import { Context } from "../context.js";
import getSetDayMetadata from "./getSetDayMetadata.js";
import getSetPhotoMetadata from "./getSetPhotoMetadata.js";
import multiplexedWebSocket from "./multiplexedWebSocket/index.js";

export default (app: Application, context: Context): void => {
  getSetDayMetadata(app, context);
  getSetPhotoMetadata(app, context);
  multiplexedWebSocket(app, context);
};
