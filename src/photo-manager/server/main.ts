import * as express from "express";
import * as path from "path";

import getCountsByDate from "./getCountsByDate";
import getPhotosOnDate from "./getPhotosOnDate";
import getFullImage from "./getFullImage";
import getPhotoMetadata from "./getPhotoMetadata";
import getThumbnailMulti from "./getThumbnailMulti";
import contextBuilder from "./contextBuilder";
import getPreview from "./getPreview";
import getSetDayMetadata from "./getSetDayMetadata";
import getRoot from "./getRoot";
import getPages from "./getPages";
import legacyRedirects from "./legacyRedirects";

const app = express();

const context = contextBuilder({
  port: 4000,
  baseUrlWithoutSlash: "http://localhost:4000",
});

app.use(
  express.static(path.join(__dirname, "../../../photo-manager-client/public"))
);

app.use(express.json());

getRoot(app, context);
getPages(app, context);
legacyRedirects(app, context);

getCountsByDate(app, context);
getPhotosOnDate(app, context);
getFullImage(app, context);
getPhotoMetadata(app, context);
getThumbnailMulti(app, context);
getPreview(app, context);
getSetDayMetadata(app, context);

app.listen(context.port, () => {
  console.log(`listening on port ${context.port}`);
});
