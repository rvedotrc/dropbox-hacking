import { Application } from "express-ws";

import { Context } from "../../context.js";
import { getLogPrefix } from "../../main.js";
import { messageHandlerBuilder } from "./messageHandler.js";
import { tryJsonParse } from "./tryJsonParse.js";

const IDLE_MILLIS = 60 * 1000;

export default (app: Application, context: Context): void => {
  const messageHandler = messageHandlerBuilder(context);

  app.ws("/api/ws", function (ws, req) {
    const id = getLogPrefix(req) || "?";

    try {
      // console.log(`${id} New websocket`);

      const closer = (signal: NodeJS.Signals) => {
        process.nextTick(() => {
          console.log(
            `${id} Caught ${signal}, Closing websocket and removing SIG listeners`,
          );
          ws.close();
          process.off("SIGINT", closer);
          process.off("SIGTERM", closer);
        });
      };

      console.log(`${id} Adding SIG listeners`);
      process.on("SIGINT", closer);
      process.on("SIGTERM", closer);

      const idle = () => {
        // console.log(`${id} Websocket marked as idle, closing`);
        // closer();
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
            messageHandler(p.value).then(
              (response) => {
                if (response === undefined) {
                  console.error(
                    `${id} Handler resolved undefined, no response sent`,
                  );
                } else {
                  console.debug(`${id} ws send:`, JSON.stringify(response));
                  ws.send(JSON.stringify(response));
                }
              },
              (error) => {
                console.error(
                  `${id} Request handler failed, no response sent:`,
                  error,
                );
              },
            );
          } else {
            console.error(`${id} Failed to parse request, no response sent`);
          }
        } else {
          console.error(`${id} Bad request type, no response sent`);
        }
      });

      ws.on("close", (...args) => {
        console.log(`${id} ws close, removing SIG listeners`, args);
        process.off("SIGINT", closer);
        process.off("SIGTERM", closer);
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
