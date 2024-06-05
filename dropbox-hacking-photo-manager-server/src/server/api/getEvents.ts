import { DPMAnyEvent } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context";
import { getLogPrefix } from "../main";

export default (app: Application, context: Context): void => {
  app.get("/api/events", (req, res) => {
    const id = getLogPrefix(req) || "?";

    // req.on("close", () => console.log(`${id} req close`));
    // req.on("error", (err) => console.log(`${id} req error`, err)); // e.g. err.code === 'ECONNRESET'
    // req.on("end", () => console.log(`${id} req end`));

    // res.on("close", () => console.log(`${id} [res closed]`));
    // res.on("error", (err) => console.log(`${id} res error`, err));

    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.writeHead(200);

    const emit = (e: DPMAnyEvent) => {
      if (e.event_name !== "ping")
        console.log(`${id} emit ${JSON.stringify(e)}`);
      res.write(`data: ${JSON.stringify(e)}\r\n\r\n`);
    };

    const lsListener = () =>
      emit({
        event_name: "change",
        event_resource: "ls",
        event_timestamp: new Date().getTime(),
      });

    context.lsFeed.on("change", lsListener);

    const exifListener = () =>
      emit({
        event_name: "change",
        event_resource: "exif",
        event_timestamp: new Date().getTime(),
      });

    context.exifDbFeed.on("change", exifListener);

    const daysListener = () =>
      emit({
        event_name: "change",
        event_resource: "days",
        event_timestamp: new Date().getTime(),
      });
    context.daysFeed.on("change", daysListener);

    const pingTimer = setInterval(
      () =>
        emit({
          event_name: "ping",
          event_resource: "events",
          event_timestamp: new Date().getTime(),
        }),
      5000,
    );

    res.on("close", () => {
      console.log(`${id} res close, closing feeds`);
      context.lsFeed.off("change", lsListener);
      context.exifDbFeed.off("change", exifListener);
      context.daysFeed.off("change", daysListener);
      clearTimeout(pingTimer);
    });

    const serverStop = () => {
      process.nextTick(() => {
        console.log(`${id} serverStop`);
        res.end(() => {
          console.log(`${id} res.end done`);
        });
        process.off("SIGINT", serverStop);
        process.off("SIGTERM", serverStop);
      });
    };

    process.once("SIGINT", serverStop);
    process.once("SIGTERM", serverStop);

    emit({
      event_name: "connect",
      event_resource: "events",
      event_timestamp: new Date().getTime(),
    });
  });
};
