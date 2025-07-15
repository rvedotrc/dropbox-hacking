import generateId from "@lib/generateId";
import type {
  IOHandler,
  ObservableUpdate,
} from "dropbox-hacking-photo-manager-shared";
import type {
  FeedMap,
  RequestTypeFor,
  ResponseTypeFor,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";
import { Observable } from "rxjs";

export const getRxFeed = <
  NAME extends keyof FeedMap,
  RES extends ResponseTypeFor<NAME>,
  REQ extends RequestTypeFor<NAME>,
>(
  request: REQ,
  io: IOHandler<ObservableUpdate<RES>, REQ>,
): Observable<RES> =>
  new Observable<RES>((subscriber) => {
    const id = generateId();
    console.debug(`getRxFeed(${request.type}, ${io.inspect()}) -> ${id}`);

    const sender = io.connect({
      receive: (m) => {
        if (m.tag === "next") subscriber.next(m.value);
        if (m.tag === "complete") subscriber.complete();
        if (m.tag === "error") subscriber.error(m.error);
      },
      close: () => subscriber.unsubscribe(),
      inspect: () => id,
    });

    sender.send(request);

    return () => {
      console.log(`getRxFeed [${id}] observer close`);
      sender.close();
    };
  });
