import * as v2 from "@blaahaj/dropbox-hacking-util/v2";
import type { Dropbox } from "dropbox";
import { Application, type Response } from "express";
import type { IncomingMessage } from "http";
import * as https from "https";
import { map } from "rxjs";

import { Context } from "../context.js";

const revExistsBuilder =
  (context: Context) =>
  (rev: string): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      const obs = context.fullDatabaseFeeds.allFilesByRev.pipe(
        map((files) => files.has(rev)),
      );
      const subscription = obs.subscribe((exists) => {
        resolve(exists);
        process.nextTick(() => subscription.unsubscribe());
      });
    });

const doHttpsGet = (url: string) =>
  new Promise<IncomingMessage>((resolve, reject) => {
    const req = https.get(url, {});
    req.on("error", reject);
    req.on("response", resolve);
  });

const proxyResponse = (imageRes: IncomingMessage, res: Response) =>
  new Promise<void>((resolve, _reject) => {
    // const expirySeconds = 4 * 3600; // dbx docs
    // const expiresAt = new Date(new Date().getTime() + expirySeconds * 1000);

    res.status(200);
    if (imageRes.headers["content-type"])
      res.contentType(imageRes.headers["content-type"]);
    if (imageRes.headers["content-encoding"])
      res.setHeader("Content-Encoding", imageRes.headers["content-encoding"]);
    res.setHeader("Content-Disposition", "inline");

    const maxAge = 86400;
    const expires = new Date(new Date().getTime() + maxAge * 1000);
    res.setHeader("Expires", expires.toUTCString());
    res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

    imageRes.pipe(res);
    imageRes.on("close", resolve);
  });

const getAndProxyLink = (imageUrl: string, res: Response) =>
  doHttpsGet(imageUrl).then(
    (imageResponse) => {
      if (imageResponse.statusCode !== 200) {
        console.info(
          `GET ${imageUrl} => ${imageResponse.statusCode} (so we respond 500)`,
        );
        if (!res.headersSent) res.sendStatus(500);
        return;
      }

      return proxyResponse(imageResponse, res);
    },
    (imageError) => {
      console.error(`GET ${imageUrl} error:`, imageError);
      if (!res.headersSent) res.sendStatus(500);
    },
  );

const getAndProxyImage = (dbx: Dropbox, path: string, res: Response) =>
  dbx
    .filesGetTemporaryLink({ path })
    .then(...v2.processPromise)
    .then((r) => {
      if (!r.resolved) {
        console.error("filesGetTemporaryLink failed:", r);
        res.sendStatus(500);
        return;
      }

      return getAndProxyLink(r.value.result.link, res);
    });

export default (app: Application, context: Context): void => {
  const revExists = revExistsBuilder(context);

  app.get(
    "/image/rev/:rev",
    (req, res) =>
      void Promise.all([revExists(req.params.rev), context.dropboxClient])
        .then(([exists, dbx]) => {
          if (exists) {
            return getAndProxyImage(dbx, `rev:${req.params.rev}`, res);
          } else {
            res.status(404);
            res.json({ error: `Photo not found` });
          }
        })
        .catch((error) => {
          console.error(`GET ${req.path} exception:`, error);
          if (!res.headersSent) res.sendStatus(500);
        })
        .finally(() => res.end()),
  );
};
