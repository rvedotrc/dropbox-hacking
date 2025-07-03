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
import {
  provideBasicCounts,
  provideContentHash,
  provideDayFiles,
  provideExifExplorer,
  provideFileId,
  provideFileRev,
  provideFsck,
  provideListOfDaysWithoutSamples,
  provideClosestTo,
  provideThumbnail,
  provideTags,
  type RxFeedRequest,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { closestToHandlerBuilder } from "../websocket/closestToHandler.js";
import { thumbnailHandlerBuilder } from "../websocket/thumbnailHandler.js";

type IsUnchanged<V> = (a: V, b: V) => boolean;

const ensureNever = <_ extends never>() => undefined;

export default (app: Application, context: Context): void => {
  if (!process.env.HOME) console.log(app, context);

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
              console.log(`${id} got request:`, JSON.stringify(request));

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
                } else if (typedRequest.type === "rx.ng.basic-counts") {
                  return serveRxFeed(
                    provideBasicCounts(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.fsck") {
                  return serveRxFeed(
                    provideFsck(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.exif-explorer") {
                  return serveRxFeed(
                    provideExifExplorer(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.list-of-days") {
                  return serveRxFeed(
                    provideListOfDaysWithoutSamples(context.fullDatabaseFeeds),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.day.files") {
                  return serveRxFeed(
                    provideDayFiles(context.fullDatabaseFeeds, {
                      date: typedRequest.date,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.content_hash") {
                  return serveRxFeed(
                    provideContentHash(context.fullDatabaseFeeds, {
                      contentHash: typedRequest.contentHash,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.file.id") {
                  return serveRxFeed(
                    provideFileId(context.fullDatabaseFeeds, {
                      id: typedRequest.id,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.file.rev") {
                  return serveRxFeed(
                    provideFileRev(context.fullDatabaseFeeds, {
                      rev: typedRequest.rev,
                    }),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.closest-to") {
                  return serveRxFeed(
                    provideClosestTo(
                      context.fullDatabaseFeeds,
                      typedRequest.request,
                      closestToHandlerBuilder(context),
                    ),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.thumbnail2") {
                  return serveRxFeed(
                    provideThumbnail(
                      context.fullDatabaseFeeds,
                      typedRequest.request,
                      thumbnailHandlerBuilder(context),
                    ),
                    () => writer,
                  );
                } else if (typedRequest.type === "rx.ng.tags") {
                  return serveRxFeed(
                    provideTags(context.fullDatabaseFeeds),
                    () => writer,
                  );
                }
                // RVE-add-feed

                ensureNever<typeof typedRequest>();
              }

              console.warn(`${id} Unrecognised request:`, request);
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
