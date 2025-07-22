import type { JSONValue } from "@blaahaj/json";
import {
  generateId,
  type IDHolder,
  type IOHandler,
  multiplexer,
  transportAsJson,
  type WrappedPayload,
} from "dropbox-hacking-photo-manager-shared";
import {
  buildFeedMap,
  type FeedMap,
  type FullDatabaseFeeds,
  type RequestTypeFor,
  type ResponseTypeFor,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import type { Application } from "express-ws";
import type { Subscription } from "rxjs";
import type { Observable } from "rxjs/internal/Observable";

import type { Context } from "../../context.js";
import { getLogPrefix } from "../../main.js";
import { thumbnailHandlerBuilder } from "../websocket/thumbnailHandler.js";
import { fromExpressWebSocket } from "./fromExpressWebSocket.js";

// const ensureNever = <_ extends never>() => undefined;

export default (app: Application, context: Context): void => {
  if (!process.env.HOME) console.log(app, context);

  const feedMap = buildFeedMap(thumbnailHandlerBuilder(context));

  app.ws("/api/ws2", function (ws, req) {
    const socketId = generateId();
    console.log(`${getLogPrefix(req) || "?"} -> ${socketId}`);

    try {
      console.log(`${socketId} New websocket`);

      const closer = (signal: NodeJS.Signals) => {
        process.nextTick(() => {
          console.log(`${socketId} Caught signal ${signal}, closing websocket`);
          ws.close();
          console.log(`${socketId} remove SIGINT/SIGTERM listeners`);
          process.off("SIGINT", closer);
          process.off("SIGTERM", closer);
        });
      };

      console.log(`${socketId} add SIGINT/SIGTERM listeners`);
      process.on("SIGINT", closer);
      process.on("SIGTERM", closer);

      ws.on("close", () => {
        console.log(`${socketId} ws closed, removing SIGINT/SIGTERM listeners`);
        process.off("SIGINT", closer);
        process.off("SIGTERM", closer);
      });

      const socketIO = fromExpressWebSocket(ws, socketId);
      const usingJSON = transportAsJson<
        IDHolder & WrappedPayload<RequestTypeFor<keyof FeedMap>>,
        IDHolder & WrappedPayload<JSONValue>
      >(socketIO);

      const connect = multiplexer(
        usingJSON,
        // FIXME: JSONValue type safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (accept: IOHandler<RequestTypeFor<keyof FeedMap>, any>) => {
          let subscription: Subscription | undefined;

          const receiverId = generateId();
          const sender = accept.connect({
            receive: (request) => {
              console.log(
                `${receiverId} got request: ${JSON.stringify(request)}`,
              );

              const type = request.type;

              const provider = feedMap[type].provider as (
                feeds: FullDatabaseFeeds,
                request: RequestTypeFor<typeof type>,
              ) => Observable<ResponseTypeFor<typeof type>>;

              const observable = provider(context.fullDatabaseFeeds, request);

              subscription = observable.subscribe({
                next: (value) => sender.send({ tag: "next", value }),
                complete: () => {
                  sender.send({ tag: "complete" });
                  sender.close();
                },
                error: (error) => {
                  sender.send({ tag: "error", error });
                  sender.close();
                },
              });
            },
            close: () => subscription?.unsubscribe(),
            inspect: () => receiverId,
          });

          console.debug(
            `connect(${accept.inspect()}) -> R=${receiverId} S=${sender.inspect()}`,
          );
        },
      );

      {
        const hup = () =>
          process.nextTick(() =>
            console.log(`${socketId} dump: ${connect.inspect()}`),
          );
        process.on("SIGHUP", hup);
        ws.on("close", () => process.off("SIGHUP", hup));
      }

      // ws.on("open", (..._args) => console.log(`${id} ws open`));
      // ws.on("ping", (..._args) => console.log(`${id} ws ping`));
      // ws.on("pong", (..._args) => console.log(`${id} ws pong`));
      // ws.on("upgrade", (..._args) => console.log(`${id} ws upgrade`));
      ws.on("unexpected-response", (..._args) =>
        console.log(`${socketId} ws unexpected response`),
      );
      ws.on("error", (...args) => console.log(`${socketId} ws error`, args));
    } catch (e) {
      console.error(`${socketId} threw`, e);
    }
  });
};
