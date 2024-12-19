import { Application } from "express-ws";

import { Context } from "../../context";
import { getLogPrefix } from "../../main";
import { requestHandler } from "./requestHandler";
import { tryJsonParse } from "./tryJsonParse";

const IDLE_MILLIS = 60 * 1000;

export default (app: Application, context: Context): void => {
  const handler = requestHandler(context);

  app.ws("/api/ws", function (ws, req) {
    const id = getLogPrefix(req) || "?";

    try {
      // console.log(`${id} New websocket`);

      const closer = () => {
        process.nextTick(() => {
          console.log(`${id} Closing websocket`);
          ws.close();
          process.off("SIGINT", closer);
          process.off("SIGTERM", closer);
        });
      };

      process.on("SIGINT", closer);
      process.on("SIGTERM", closer);

      const idle = () => {
        console.log(`${id} Websocket marked as idle, closing`);
        closer();
      };

      let idleTimer = setTimeout(idle, IDLE_MILLIS);

      const resetIdle = () => {
        clearTimeout(idleTimer);
        return (idleTimer = setTimeout(idle, IDLE_MILLIS));
      };

      ws.on("message", (data, isBinary) => {
        console.log(`${id} ws message`, data, isBinary);
        resetIdle();

        if (typeof data === "string" && !isBinary) {
          const p = tryJsonParse(data);

          if (p.ok) {
            handler(p.value).then(
              (response) => {
                if (response === undefined) {
                  console.error(`Handler resolved undefined, no response sent`);
                } else {
                  // console.debug(`ws send:`, response);
                  ws.send(JSON.stringify(response));
                }
              },
              (error) => {
                console.error(
                  `Request handler failed, no response sent:`,
                  error,
                );
              },
            );
          } else {
            console.error(`Failed to parse request, no response sent`);
          }
        } else {
          console.error(`Bad request type, no response sent`);
        }
      });

      ws.on("close", (...args) => {
        console.log(`${id} ws close`, args);
        clearTimeout(idleTimer);
      });

      // ws.on("open", (..._args) => console.log(`${id} ws open`));
      // ws.on("ping", (..._args) => console.log(`${id} ws ping`));
      // ws.on("pong", (..._args) => console.log(`${id} ws pong`));
      // ws.on("upgrade", (..._args) => console.log(`${id} ws upgrade`));
      // ws.on("unexpected-response", (..._args) =>
      //   console.log(`${id} ws unexpected response`),
      // );
      // ws.on("error", (...args) => console.log(`${id} ws error`, args));

      // console.log(`${id} socket opened`);
    } catch (e) {
      console.error(`${id} threw`, e);
    }
  });
};
