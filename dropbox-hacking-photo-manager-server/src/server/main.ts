import { randomUUID } from "crypto";
import express from "express";
import expressWs from "express-ws";

import api from "./api/index.js";
import contextBuilder from "./contextBuilder.js";
import getPages from "./getPages.js";
import getRoot from "./getRoot.js";
import image from "./image/index.js";
import legacyRedirects from "./legacyRedirects.js";

const appWithoutWs = express();
const appWithWs = expressWs(appWithoutWs).app;

const context = contextBuilder({
  port: 4000,
  baseUrlWithoutSlash: "http://localhost:4000",
});

const logPrefixKey: unique symbol = Symbol("logPrefix");
type LogPrefixKey = typeof logPrefixKey;
type WithLogPrefix<T extends object = object> = T &
  Record<LogPrefixKey, string | undefined>;

export const getLogPrefix = (req: unknown): string | undefined => {
  return (req as WithLogPrefix)[logPrefixKey];
};

let nextId = 0;
appWithWs.use((req, res, next) => {
  const requestId = `REQ ${randomUUID()} #${++nextId} ${req.method} ${req.url} HTTP/${req.httpVersion} :`;
  (req as unknown as WithLogPrefix)[logPrefixKey] = requestId;

  const startTime = new Date().getTime();

  const startingTimeout = setTimeout(() => {
    console.log(`${requestId} starting (log message deferred)`);
  }, 200);

  let requestClosed = false;
  let responseClosed = false;

  const checkClosed = () => {
    if (!requestClosed || !responseClosed) return;

    const endTime = new Date().getTime();
    clearTimeout(startingTimeout);

    // console.log(requestId, "req", req);
    // console.log(requestId, "res", res);

    console.log(
      `${requestId} ${endTime - startTime}ms ${res.statusCode} ${res.statusMessage}`,
    );
  };

  req.on("close", () => {
    requestClosed = true;
    checkClosed();
  });

  res.on("close", () => {
    responseClosed = true;
    checkClosed();
  });

  // req.on("close", () => console.log(`${requestId} req close`));
  // req.on("error", (err) => console.log(`${requestId} req error`, err));
  // req.on("end", () => console.log(`${requestId} req end`));
  //
  // res.on("close", () => console.log(`${requestId} res close`));
  // res.on("error", (err) => console.log(`${requestId} res error`, err));
  // res.on("finish", () => console.log(`${requestId} res finish`));

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
  void context.close();
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
