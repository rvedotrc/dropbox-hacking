import type {
  PingRequest,
  PingResponse,
  SimpleRequest,
  SimpleResponse,
  ThumbnailRequest,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";
import { Application } from "express-ws";

import { Context } from "../../context";
import { getLogPrefix } from "../../main";

const IDLE_MILLIS = 60 * 1000;

export default (app: Application, _context: Context): void => {
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
          try {
            const wsReq = JSON.parse(data);

            if (
              wsReq !== null &&
              typeof wsReq === "object" &&
              "type" in wsReq &&
              typeof wsReq.type === "string"
            ) {
              console.log({ wsReq });

              if (wsReq.type === "simpleRequest") {
                const tReq: SimpleRequest<unknown> = wsReq;
                const p: PingRequest | ThumbnailRequest | { verb?: unknown } =
                  tReq.payload as object;

                if (p.verb === "ping") {
                  const payload: SimpleResponse<PingResponse> = {
                    type: "simpleResponse",
                    id: tReq.id,
                    payload: { answer: "pong" },
                  };
                  ws.send(JSON.stringify(payload));
                } else if (p.verb === "getThumbnail") {
                  const payload: SimpleResponse<ThumbnailResponse> = {
                    type: "simpleResponse",
                    id: tReq.id,
                    payload: { thumbnail: null },
                  };
                  ws.send(JSON.stringify(payload));
                } else {
                  console.warn("Ignoring unparseable request");
                }
              } else {
                console.warn("Ignoring unparseable request");
              }
            } else {
              console.warn("Ignoring unparseable request");
            }
          } catch (err) {
            console.warn("Ignoring unparseable request");
          }
        } else {
          console.warn("Ignoring unparseable request");
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
