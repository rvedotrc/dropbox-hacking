import type {
  IOHandler,
  RxFeedResponse,
} from "dropbox-hacking-photo-manager-shared";
import { Observable } from "rxjs";

export const getRxFeed = <T, R>(
  request: R,

  io: IOHandler<RxFeedResponse<T>, R>,
): Observable<T> =>
  new Observable<T>((subscriber) => {
    const sender = io({
      receive: (m) => {
        if (m.tag === "next") subscriber.next(m.value);
        if (m.tag === "complete") subscriber.complete();
        if (m.tag === "error") subscriber.error(m.error);
      },
      close: () => {
        console.log("getRxFeed received close");
        subscriber.unsubscribe();
      },
    });

    sender.send(request);

    return () => {
      console.log("getRxFeed observer close");
      sender.close();
    };
  });
