import * as express from "express";
import * as path from "path";

import getCountsByDate from "./getCountsByDate";
import getPhotosOnDate from "./getPhotosOnDate";
import getFullImage from "./getFullImage";
import getPhotoMetadata from "./getPhotoMetadata";
import getThumbnailMulti from "./getThumbnailMulti";
import contextBuilder from "./contextBuilder";
import getPreview from "./getPreview";

const app = express();

const context = contextBuilder();

app.use(
  express.static(path.join(__dirname, "../../../photo-manager-client/public"))
);

getCountsByDate(app, context);
getPhotosOnDate(app, context);
getFullImage(app, context);
getPhotoMetadata(app, context);
getThumbnailMulti(app, context);
getPreview(app, context);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
