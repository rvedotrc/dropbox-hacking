import { Application } from "express-ws";

import { Context } from "../context.js";
import getSetDayMetadata from "./getSetDayMetadata.js";
import getThumbnailMulti from "./getThumbnailMulti.js";
import { route as getWs } from "./websocket/index.js";
import multiplexedWebSocket from "./multiplexedWebSocket/index.js";

export default (app: Application, context: Context): void => {
  getThumbnailMulti(app, context);
  getSetDayMetadata(app, context);
  getWs(app, context);
  multiplexedWebSocket(app, context);
};
