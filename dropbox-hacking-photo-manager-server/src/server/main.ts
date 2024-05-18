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

app.use(express.static(process.env.PUBLIC_DIR || "/dne"));

app.use(express.json());

getRoot(app, context);
getPages(app, context);
legacyRedirects(app, context);

api(app, context);
image(app, context);

const server = app.listen(context.port, () => {
  console.log(`Listening on port ${context.port}`);
});

server.on("close", () => {
  console.log("Server closed, now closing context");
  context.close();
});

const requestStop = (reason: string) =>
  process.nextTick(() => {
    console.log(`Shutting down server because of ${reason}`);
    server.close();
  });

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);
