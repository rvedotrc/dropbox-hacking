import type { IOHandler, Receiver, Sender } from "./types.js";

export const spyOnReceiver = <R>(base: Receiver<R>): Receiver<R> => {
  let messageCount = 0;

  const wrapped: Receiver<R> = {
    receive: (message) => {
      ++messageCount;
      console.debug(`${wrapped.inspect()} message (count: ${messageCount})`);
      base.receive(message);
    },
    close: () => {
      console.debug(`${wrapped.inspect()} close`);
      base.close();
    },
    inspect: () => `<spyOnReceiver ${base.inspect()}>`,
  };

  return wrapped;
};

export const spyOnSender = <S>(base: Sender<S>): Sender<S> => {
  let messageCount = 0;

  const wrapped: Sender<S> = {
    send: (message) => {
      ++messageCount;
      console.debug(`${wrapped.inspect()} message (count: ${messageCount})`);
      base.send(message);
    },
    close: () => {
      console.debug(`${wrapped.inspect()} close`);
      base.close();
    },
    inspect: () => `<spyOnSender ${base.inspect()}>`,
  };

  return wrapped;
};

export const spyOnConnector = <R, S>(
  base: IOHandler<R, S>,
): IOHandler<R, S> => {
  let connectionCount = 0;

  const wrapped: IOHandler<R, S> = {
    connect: (receiver) => {
      ++connectionCount;
      const wrappedReceiver = spyOnReceiver(receiver);
      const sender = base.connect(wrappedReceiver);
      const wrappedSender = spyOnSender(sender);
      console.debug(
        `${wrapped.inspect()} connect [${wrappedReceiver.inspect()}, ${wrappedSender.inspect()}] (count: ${connectionCount})`,
      );
      return wrappedSender;
    },
    inspect: () => `<spyOnConnector ${base.inspect()}>`,
  };

  return wrapped;
};
