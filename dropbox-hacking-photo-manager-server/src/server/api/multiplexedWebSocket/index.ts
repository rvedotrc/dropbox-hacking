import type { JSONValue } from "@blaahaj/json";
import {
  type IDHolder,
  type IOHandler,
  multiplexer,
  spy,
  transportAsJson,
  type WrappedPayload,
} from "dropbox-hacking-photo-manager-shared";
import {
  buildFeedMap,
  type FullDatabaseFeeds,
  type RequestTypeFor,
  type ResponseTypeFor,
  type RxFeedRequest,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import type { Application } from "express-ws";
import type { Observable } from "rxjs/internal/Observable";

import type { Context } from "../../context.js";
import { getLogPrefix } from "../../main.js";
import { thumbnailHandlerBuilder } from "../websocket/thumbnailHandler.js";
import { fromExpressWebSocket } from "./fromExpressWebSocket.js";
import { serveRxFeed } from "./serveRxFeed.js";

// const ensureNever = <_ extends never>() => undefined;

export default (app: Application, context: Context): void => {
  if (!process.env.HOME) console.log(app, context);

  const feedMap = buildFeedMap(thumbnailHandlerBuilder(context));

  app.ws("/api/ws2", function (ws, req) {
    const id = getLogPrefix(req) || "?";

    try {
      console.log(`${id} New websocket`);

      const closer = (signal: NodeJS.Signals) => {
        process.nextTick(() => {
          console.log(`${id} Caught signal ${signal}, closing websocket`);
          ws.close();
          console.log(`${id} remove SIGINT/SIGTERM listeners`);
          process.off("SIGINT", closer);
          process.off("SIGTERM", closer);
        });
      };

      console.log(`${id} add SIGINT/SIGTERM listeners`);
      process.on("SIGINT", closer);
      process.on("SIGTERM", closer);

      const socketIO = fromExpressWebSocket(ws);
      // const spiedSocket = spy(socketIO, "socket");
      const usingJSON = transportAsJson<
        IDHolder & WrappedPayload<JSONValue>,
        IDHolder & WrappedPayload<JSONValue>
      >(socketIO);

      const connect = multiplexer(
        // spy(usingJSON, "using-json"),
        usingJSON,
        // FIXME: JSONValue type safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (accept: IOHandler<any, any>) => {
          // const spiedAccept = spy(accept, "accept");
          const sender = accept({
            receive: (request) => {
              console.log(`${id} got request:`, JSON.stringify(request));

              if (
                typeof request === "object" &&
                request !== null &&
                "type" in request &&
                typeof request.type === "string"
              ) {
                const typedRequest = request as RxFeedRequest;

                const type = typedRequest.type;

                const provider = feedMap[type].provider as (
                  feeds: FullDatabaseFeeds,
                  request: RequestTypeFor<typeof type>,
                ) => Observable<ResponseTypeFor<typeof type>>;

                const obs = provider(context.fullDatabaseFeeds, typedRequest);
                return serveRxFeed(obs, () => sender);

                // ensureNever<typeof typedRequest>();
              }

              console.warn(`${id} Unrecognised request:`, request);
              sender.close();
            },
            close: () => {},
          });
        },
      );

      const _spiedConnect = spy(connect, "connect");

      {
        const dump =
          "inspect" in connect
            ? (connect.inspect as () => string)
            : () => "(no inspect available)";

        const hup = () =>
          process.nextTick(() => console.log(`${id} dump: ${dump()}`));
        process.on("SIGHUP", hup);
        ws.on("close", () => process.off("SIGHUP", hup));
      }

      ws.on("open", (..._args) => console.log(`${id} ws open`));
      ws.on("ping", (..._args) => console.log(`${id} ws ping`));
      ws.on("pong", (..._args) => console.log(`${id} ws pong`));
      // // ws.on("upgrade", (..._args) => console.log(`${id} ws upgrade`));
      ws.on("unexpected-response", (..._args) =>
        console.log(`${id} ws unexpected response`),
      );
      ws.on("error", (...args) => console.log(`${id} ws error`, args));

      console.log(`${id} socket opened`);
      ws.on("close", () => {
        console.log(`${id} ws closed, removing SIGINT/SIGTERM listeners`);
        process.off("SIGINT", closer);
        process.off("SIGTERM", closer);
      });
    } catch (e) {
      console.error(`${id} threw`, e);
    }
  });
};
