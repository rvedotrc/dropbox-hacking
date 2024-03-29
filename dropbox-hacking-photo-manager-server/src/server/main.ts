import express from "express";

import api from "./api";
import contextBuilder from "./contextBuilder";
import getPages from "./getPages";
import getRoot from "./getRoot";
import image from "./image";
import legacyRedirects from "./legacyRedirects";

const app = express();

const context = contextBuilder({
  port: 4000,
  baseUrlWithoutSlash: "http://localhost:4000",
});

app.use(express.static(process.env.PUBLIC_DIR));

app.use(express.json());

getRoot(app, context);
getPages(app, context);
legacyRedirects(app, context);

api(app, context);
image(app, context);

app.listen(context.port, () => {
  console.log(`Listening on port ${context.port}`);
});
