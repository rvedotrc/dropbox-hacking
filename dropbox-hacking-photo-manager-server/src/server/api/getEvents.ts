import { DPMAnyEvent } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context";

export default (app: Application, context: Context): void => {
  app.get("/api/events", (req, res) => {
    req.on("close", () => console.log("req close"));
    req.on("error", (err) => console.log("req error", err));
    req.on("resume", () => console.log("req resume"));
    req.on("end", () => console.log("req end"));
    req.on("data", (chunk) => console.log("req data", chunk));
    req.on("readable", () => console.log("req readable"));
    req.on("pause", () => console.log("req pause"));

    res.on("close", () => console.log("res close"));
    res.on("unpipe", (src) => console.log("res unpipe", src));
    res.on("finish", () => console.log("res finish"));
    res.on("pipe", (src) => console.log("res pipe", src));
    res.on("drain", () => console.log("res drain"));
    res.on("error", (err) => console.log("res error", err));

    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.writeHead(200);

    const emit = (e: DPMAnyEvent) => {
      // console.log("emit", e);
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
      context.lsFeed.off("change", lsListener);
      context.exifDbFeed.off("change", exifListener);
      context.daysFeed.off("change", daysListener);
      clearTimeout(pingTimer);
    });

    emit({
      event_name: "connect",
      event_resource: "events",
      event_timestamp: new Date().getTime(),
    });
  });
};
