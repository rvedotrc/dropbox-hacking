import type {
  IOHandler,
  RxFeedResponse,
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
  io: IOHandler<RxFeedResponse<RES>, REQ>,
): Observable<RES> =>
  new Observable<RES>((subscriber) => {
    const sender = io.connect({
      receive: (m) => {
        if (m.tag === "next") subscriber.next(m.value);
        if (m.tag === "complete") subscriber.complete();
        if (m.tag === "error") subscriber.error(m.error);
      },
      close: () => {
        console.log("getRxFeed received close");
        subscriber.unsubscribe();
      },
      inspect: () => ``,
    });

    sender.send(request);

    return () => {
      console.log("getRxFeed observer close");
      sender.close();
    };
  });
