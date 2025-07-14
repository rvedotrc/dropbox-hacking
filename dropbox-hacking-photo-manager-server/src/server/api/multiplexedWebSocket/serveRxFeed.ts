import type { RxFeedResponse } from "dropbox-hacking-photo-manager-shared";
import { IOHandler } from "dropbox-hacking-photo-manager-shared";
import { Observable } from "rxjs";

export const serveRxFeed = <T>(
  observable: Observable<T>,
  io: IOHandler<never, RxFeedResponse<T>>,
): void => {
  const sender = io.connect({
    receive: () => sender.close(),
    close: () => subscription?.unsubscribe(),
    inspect: () => `<serveRxFeed sender over ${io.inspect()}>`,
  });

  const subscription = observable.subscribe({
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
};
