import type { RxFeedResponse } from "dropbox-hacking-photo-manager-shared";
import { Observable } from "rxjs";

import { IOHandler } from "dropbox-hacking-photo-manager-shared";

export const serveRxFeed = <T>(
  observable: Observable<T>,
  io: IOHandler<never, RxFeedResponse<T>>
): void => {
  const writer = io({
    receive: () => writer.close(),
    close: () => subscription?.unsubscribe(),
  });

  const subscription = observable.subscribe({
    next: (value) => writer.send({ tag: "next", value }),
    complete: () => {
      writer.send({ tag: "complete" });
      writer.close();
    },
    error: (error) => {
      writer.send({ tag: "error", error });
      writer.close();
    },
  });
};
