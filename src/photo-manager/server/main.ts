import * as express from "express";
import * as path from "path";

import contextBuilder from "./contextBuilder";
import getRoot from "./getRoot";
import getPages from "./getPages";
import legacyRedirects from "./legacyRedirects";
import api from "./api";
import image from "./image";

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

api(app, context);
image(app, context);

app.listen(context.port, () => {
  console.log(`Listening on port ${context.port}`);
});
