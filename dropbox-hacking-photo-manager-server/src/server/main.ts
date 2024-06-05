import express from "express";
import expressWs from "express-ws";

import api from "./api";
import contextBuilder from "./contextBuilder";
import getPages from "./getPages";
import getRoot from "./getRoot";
import image from "./image";
import legacyRedirects from "./legacyRedirects";

const appWithoutWs = express();
const appWithWs = expressWs(appWithoutWs).app;

const context = contextBuilder({
  port: 4000,
  baseUrlWithoutSlash: "http://localhost:4000",
});

appWithWs.use(express.static(process.env.PUBLIC_DIR || "/dne"));

appWithWs.use(express.json());

getRoot(appWithWs, context);
getPages(appWithWs, context);
legacyRedirects(appWithWs, context);

api(appWithWs, context);
image(appWithWs, context);

const server = appWithWs.listen(context.port, () => {
  console.log(`Listening on port ${context.port}`);
});

server.on("close", () => {
  console.log("Server closed, now closing context");
  context.close();
});

const requestStop = (reason: string) =>
  process.nextTick(() => {
    console.log(`Shutting down server because of ${reason}`);
    server.closeIdleConnections();
    server.close();
    const t = setTimeout(() => {
      server.closeAllConnections();
    }, 2000);
    server.once("close", () => clearTimeout(t));
  });

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);
