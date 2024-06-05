import { Application } from "express-ws";

import { Context } from "../../context";

export default (app: Application, _context: Context): void => {
  app.ws("/api/ws", function (ws, _req) {
    ws.on("message", function (...args) {
      console.log("ws message", args);
    });

    ws.on("close", (...args) => console.log("ws close", args));
    ws.on("open", (..._args) => console.log("ws open"));
    ws.on("ping", (..._args) => console.log("ws ping"));
    ws.on("pong", (..._args) => console.log("ws pong"));
    ws.on("upgrade", (..._args) => console.log("ws upgrade"));
    ws.on("unexpected-response", (..._args) =>
      console.log("ws unexpected response"),
    );
    ws.on("error", (...args) => console.log("ws error", args));

    const timer = setInterval(() => {
      console.log("Sending time");
      ws.send(`The server time is ${new Date().toISOString()}\n`);
    }, 5000);
    ws.once("close", () => clearInterval(timer));

    const closer = () => {
      process.nextTick(() => {
        console.log("Closing socket");
        ws.close();
        process.off("SIGINT", closer);
        process.off("SIGTERM", closer);
      });
    };

    process.on("SIGINT", closer);
    process.on("SIGTERM", closer);

    console.log("socket opening");
  });
};
