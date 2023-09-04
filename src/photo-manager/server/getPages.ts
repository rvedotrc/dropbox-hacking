import { Application } from "express";
import { Context } from "./context";
import { Payload } from "../shared/types";

export default (app: Application, _context: Context): void => {
  const htmlEncode = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const pageAsString = (
    title: string,
    payload: Payload
  ): string => `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${title}</title>
            <link rel="stylesheet" type="text/css" href="/style.css">
        </head>
        <body>
            <div id="react_container"></div>
            <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
            <script id="payload-script" src="/dist/main.js" data-payload="${htmlEncode(
              JSON.stringify(payload)
            )}"></script>
        </body>
    </html>
  `;

  app.get("/calendar", (req, res) => {
    res.contentType("text/html");
    res.send(pageAsString("DPM - Calendar", { route: "calendar" }));
  });

  app.get("/days", (req, res) => {
    res.contentType("text/html");
    res.send(pageAsString("DPM - Days", { route: "days" }));
  });

  app.get("/day/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString(`DPM - ${req.params.date}`, {
        route: "day",
        date: req.params.date,
      })
    );
  });

  app.get("/photo/rev/:rev", (req, res) => {
    res.contentType("text/html");
    res.send(
      pageAsString(`DPM - ${req.params.rev}`, {
        route: "photo",
        rev: req.params.rev,
      })
    );
  });
};
