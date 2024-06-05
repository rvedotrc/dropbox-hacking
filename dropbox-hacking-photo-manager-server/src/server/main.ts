import { randomUUID } from "crypto";
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

const logPrefixKey = Symbol();
export const getLogPrefix = (req: unknown): string | undefined => {
  const value = (req as any)[logPrefixKey]; // eslint-disable-line @typescript-eslint/no-explicit-any
  return typeof value === "string" ? value : undefined;
};

let nextId = 0;
appWithWs.use((req, res, next) => {
  const requestId = `REQ ${randomUUID()} #${++nextId} ${req.method} ${req.url} ${req.httpVersion}`;
  (req as any)[logPrefixKey] = requestId; // eslint-disable-line @typescript-eslint/no-explicit-any

  console.log(`${requestId} starting`);

  req.on("close", () => console.log(`${requestId} req close`));
  req.on("error", (err) => console.log(`${requestId} req error`, err));
  req.on("end", () => console.log(`${requestId} req end`));

  res.on("close", () => console.log(`${requestId} res close`));
  res.on("error", (err) => console.log(`${requestId} res error`, err));
  res.on("finish", () => console.log(`${requestId} res finish`));

  next();
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

    server.close();

    const tCloseIdle = setInterval(() => server.closeIdleConnections(), 100);
    server.once("close", () => clearTimeout(tCloseIdle));

    const tForceCloseAll = setTimeout(() => {
      console.error("Force-closing all connections");
      server.closeAllConnections();
    }, 10000);
    server.once("close", () => clearTimeout(tForceCloseAll));
  });

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);
