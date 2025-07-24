import type { ObservableUpdate } from "dropbox-hacking-photo-manager-shared";
import { generateId, IOHandler } from "dropbox-hacking-photo-manager-shared";
import { Observable } from "rxjs";

export const serveRxFeed = <T>(
  observable: Observable<T>,
  io: IOHandler<never, ObservableUpdate<T>>,
): void => {
  const id = generateId();
  console.debug(`serveRxFeed(${io.inspect()}) -> ${id}`);

  const sender = io.connect({
    receive: () => sender.close(),
    close: () => subscription?.unsubscribe(),
    inspect: () => id,
  });

  const subscription = observable.subscribe({
    next: (value) => sender.send({ tag: "next", value }),
    complete: () => {
      sender.send({ tag: "complete" });
      sender.close();
    },
    error: (error) => {
      console.error(error);
      sender.send({ tag: "error", error });
      sender.close();
    },
  });
};
