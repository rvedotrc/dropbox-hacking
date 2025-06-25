import { RouteState } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "./context.js";

export default (app: Application, _context: Context): void => {
  const htmlEncode = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const pageAsString = (routeState: RouteState): string => `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>DPM</title>
            <link rel="stylesheet" type="text/css" href="/style.css">
        </head>
        <body>
            <div id="react_container"></div>
            <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
            <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
            <script id="payload-script" src="/dist/main.js" data-routestate="${htmlEncode(
              JSON.stringify(routeState),
            )}"></script>
        </body>
    </html>
  `;

  app.get("/next-gen/basic-counts", (_req, res) => {
    res.contentType("text/html");
    res.send(pageAsString({ route: "route/next-gen/basic-counts" }));
  });

  app.get("/next-gen/fsck", (_req, res) => {
    res.contentType("text/html");
    res.send(pageAsString({ route: "route/next-gen/fsck" }));
  });

  app.get("/next-gen/list-of-days/without-samples", (_req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({ route: "route/next-gen/list-of-days/without-samples" }),
    );
  });

  app.get("/next-gen/file/id/:id", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({ route: "route/next-gen/file/id", id: req.params.id }),
    );
  });

  app.get("/next-gen/file/rev/:rev", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({ route: "route/next-gen/file/rev", rev: req.params.rev }),
    );
  });

  app.get("/next-gen/content-hash/:contentHash", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({
        route: "route/next-gen/content-hash",
        contentHash: req.params.contentHash,
      }),
    );
  });

  app.get(
    "/next-gen/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)/files",
    (req, res) => {
      res.contentType("text/html");
      res.send(
        pageAsString({
          route: "route/next-gen/day/files",
          date: req.params.date,
        }),
      );
    },
  );

  app.get("/days/calendar", (_req, res) => {
    res.contentType("text/html");
    res.send(pageAsString({ route: "calendar" }));
  });

  app.get("/days/with-samples", (_req, res) => {
    res.contentType("text/html");
    res.send(pageAsString({ route: "days" }));
  });

  app.get("/days/plain", (_req, res) => {
    res.contentType("text/html");
    res.send(pageAsString({ route: "days-plain" }));
  });

  app.get("/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({
        route: "day",
        date: req.params.date,
      }),
    );
  });

  app.get("/month/:month(\\d\\d\\d\\d-\\d\\d)", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({
        route: "month",
        month: req.params.month,
      }),
    );
  });

  app.get("/year/:year(\\d\\d\\d\\d)", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({
        route: "year",
        year: req.params.year,
      }),
    );
  });

  app.get("/photo/rev/:rev", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString({
        route: "photo",
        rev: req.params.rev,
      }),
    );
  });

  app.get("/closest-to", (req, res) => {
    const { degreesNorth, degreesEast, n } = req.query;

    if (typeof degreesEast === "string" && typeof degreesNorth === "string") {
      res.contentType("text/html");
      res.send(
        pageAsString({
          route: "closest-to",
          gps: {
            lat: parseFloat(degreesNorth),
            long: parseFloat(degreesEast),
          },
          nClosest: typeof n === "string" ? parseInt(n) : 10,
        }),
      );
    } else {
      res.send(400);
    }
  });
};
