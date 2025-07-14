import type { IOHandler, Receiver, Sender } from "./types.js";

export const spyOnReceiver = <R>(base: Receiver<R>): Receiver<R> => {
  let messageCount = 0;
  let closed = false;

  const wrapped: Receiver<R> = {
    receive: (message) => {
      ++messageCount;
      console.debug(`${wrapped.inspect()} received message`);
      base.receive(message);
    },
    close: () => {
      closed = true;
      console.debug(`${wrapped.inspect()} received close`);
      base.close();
    },
    inspect: () =>
      `<Spy on ${base.inspect()}, received ${messageCount} messages, ${closed ? "closed" : "open"}}>`,
  };

  return wrapped;
};

export const spyOnSender = <S>(base: Sender<S>): Sender<S> => {
  let messageCount = 0;
  let closed = false;

  const wrapped: Sender<S> = {
    send: (message) => {
      ++messageCount;
      console.debug(`${wrapped.inspect()} send message`);
      base.send(message);
    },
    close: () => {
      closed = true;
      console.debug(`${wrapped.inspect()} send close`);
      base.close();
    },
    inspect: () =>
      `<Spy on ${base.inspect()}, received ${messageCount} messages, ${closed ? "closed" : "open"}}>`,
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
        `${wrapped.inspect()} connect [${wrappedReceiver.inspect()}, ${wrappedSender.inspect()}]`,
      );
      return wrappedSender;
    },
    inspect: () => `<Spy on ${base.inspect()}, ${connectionCount} connections>`,
  };

  return wrapped;
};
