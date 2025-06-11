import type { Application } from "express-ws";
import type { Context } from "../../context.js";
import { getLogPrefix } from "../../main.js";
import {
  spy,
  transportAsJson,
  type IDHolder,
  type WrappedPayload,
  multiplexer,
  type IOHandler,
  compress,
  recordDeltaMaker,
} from "dropbox-hacking-photo-manager-shared";
import { isDeepStrictEqual } from "util";
import { fromExpressWebSocket } from "./fromExpressWebSocket.js";
import { map } from "rxjs";
import { serveRxFeed } from "./serveRxFeed.js";
import type { RxFeedRequest } from "../../../../../dropbox-hacking-photo-manager-shared/dist/src/serverSideFeeds/types.js";
import {
  provideBasicCounts,
  provideContentHash,
  provideDayFiles,
  provideFileId,
  provideFileRev,
  provideListOfDaysWithoutSamples,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

type IsUnchanged<V> = (a: V, b: V) => boolean;

const ensureNever = <_ extends never>() => undefined;

export default (app: Application, context: Context): void => {
  if (!process.env.HOME) console.log(app, context);

  app.ws("/api/ws2", function (ws, req) {
    const id = getLogPrefix(req) || "?";

    try {
      // console.log(`${id} New websocket`);

      const closer = () => {
        process.nextTick(() => {
          console.log(`${id} Closing websocket`);
          ws.close();
          process.off("SIGINT", closer);
          process.off("SIGTERM", closer);
          // messageHandler.close();
        });
      };

      process.on("SIGINT", closer);
      process.on("SIGTERM", closer);

      const socketIO = fromExpressWebSocket(ws);
      // const spiedSocket = spy(socketIO, "socket");
      const usingJSON = transportAsJson<
        IDHolder & WrappedPayload<unknown>,
        IDHolder & WrappedPayload<unknown>
      >(socketIO);

      const connect = multiplexer(
        // spy(usingJSON, "using-json"),
        usingJSON,
        (accept: IOHandler<unknown, unknown>) => {
          // const spiedAccept = spy(accept, "accept");
          const writer = accept({
            receive: (request) => {
              console.log(`Server got request:`, request);

              if (
                typeof request === "object" &&
                request !== null &&
                "type" in request &&
                typeof request.type === "string"
              ) {
                const typedRequest = request as RxFeedRequest;

                const squish = <V>() =>
                  map(
                    compress(
                      recordDeltaMaker(isDeepStrictEqual as IsUnchanged<V>),
                    ),
                  );

                if (typedRequest.type === "rx-days") {
                  return serveRxFeed(
                    context.dayRx().pipe(squish()),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx-photos") {
                  return serveRxFeed(
                    context.photoRx().pipe(squish()),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx-files") {
                  return serveRxFeed(
                    context.imageFilesRx().pipe(squish()),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx-exif") {
                  return serveRxFeed(
                    context.exifRx().pipe(squish()),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.basic-counts") {
                  return serveRxFeed(
                    provideBasicCounts(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.list-of-days") {
                  return serveRxFeed(
                    provideListOfDaysWithoutSamples(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.day.files") {
                  return serveRxFeed(
                    provideDayFiles(context.fullDatabaseFeeds, {
                      date: typedRequest.date,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.content_hash") {
                  return serveRxFeed(
                    provideContentHash(context.fullDatabaseFeeds, {
                      contentHash: typedRequest.contentHash,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.file.id") {
                  return serveRxFeed(
                    provideFileId(context.fullDatabaseFeeds, {
                      id: typedRequest.id,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "ng.file.rev") {
                  return serveRxFeed(
                    provideFileRev(context.fullDatabaseFeeds, {
                      rev: typedRequest.rev,
                    }),
                    () => writer,
                  );
                }
                // RVE-add-feed

                ensureNever<typeof typedRequest>();

                const _ = typedRequest;
              }

              console.warn("Unrecognised request:", request);
              writer.close();
            },
            close: () => {},
          });
        },
      );

      const _spiedConnect = spy(connect, "connect");

      ws.on("open", (..._args) => console.log(`${id} ws open`));
      ws.on("ping", (..._args) => console.log(`${id} ws ping`));
      ws.on("pong", (..._args) => console.log(`${id} ws pong`));
      // // ws.on("upgrade", (..._args) => console.log(`${id} ws upgrade`));
      ws.on("unexpected-response", (..._args) =>
        console.log(`${id} ws unexpected response`),
      );
      ws.on("error", (...args) => console.log(`${id} ws error`, args));

      console.log(`${id} socket opened`);
    } catch (e) {
      console.error(`${id} threw`, e);
    }
  });
};
