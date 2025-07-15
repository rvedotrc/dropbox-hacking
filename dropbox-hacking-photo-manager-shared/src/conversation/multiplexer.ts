import { generateId } from "./id.js";
import type { IOHandler, Receiver, Sender } from "./types.js";

export type IDHolder = {
  readonly id: string;
};

export type WrappedPayload<T> =
  | { readonly tag: "open" }
  | { readonly tag: "message"; readonly message: T }
  | { readonly tag: "close" };

export const multiplexer = <I, O>(
  base: IOHandler<IDHolder & WrappedPayload<I>, IDHolder & WrappedPayload<O>>,
  listenerCallback: (handler: IOHandler<I, O>) => void,
): IOHandler<I, O> => {
  const multiplexerId = generateId();
  const receiversById: Map<string, Receiver<I>> = new Map();
  let mx = { inspect: () => "[placeholder]" } as IOHandler<I, O>;

  const baseReceiverId = generateId();

  const baseReader: Receiver<IDHolder & WrappedPayload<I>> = {
    receive: (mxControlMessage) => {
      const { id, tag } = mxControlMessage;

      if (tag === "open") {
        if (receiversById.has(id)) {
          throw new Error(
            `Multiplexer ${multiplexerId} already has conversation ${id}`,
          );
        } else {
          const listenerId = generateId();
          const listener: IOHandler<I, O> = {
            connect: (incomingReceiver) => {
              if (receiversById.has(id)) {
                throw new Error(
                  `Multiplexer ${multiplexerId} already has conversation ${id}`,
                );
              }

              receiversById.set(mxControlMessage.id, incomingReceiver);
              console.debug(
                `mx accept(${listenerId}) -> R=${incomingReceiver.inspect()} S=${id} (count=${receiversById.size})`,
              );

              const incomingSender: Sender<O> = {
                send: (message) =>
                  baseSender.send({
                    tag: "message",
                    id,
                    message,
                  }),
                close: () => {
                  receiversById.delete(id);
                  baseSender.send({
                    tag: "close",
                    id,
                  });
                  incomingReceiver.close();
                  console.debug(
                    `${multiplexerId} ${id} closed (count=${receiversById.size})`,
                  );
                },
                inspect: () => id,
              };

              return incomingSender;
            },
            inspect: () => listenerId,
          };

          console.debug(`mx listener ${id} -> ${listenerId}`);
          listenerCallback(listener);
        }
      } else if (tag === "message") {
        const receiver = receiversById.get(mxControlMessage.id);

        if (receiver) {
          receiver.receive(mxControlMessage.message);
        } else {
          console.error("message for non-open conversation", id);
        }
      } else if (tag === "close") {
        const receiver = receiversById.get(id);

        if (receiver) {
          receiversById.delete(id);
          receiver.close();
          console.debug(
            `${multiplexerId} ${id} closed (count=${receiversById.size})`,
          );
        } else {
          console.error("close of non-open conversation", id);
        }
      }
    },

    close: () => {
      for (const [id, receiver] of receiversById.entries()) {
        console.debug(
          `${multiplexerId} mx-close, sending a receive-close for ${id}`,
        );

        receiver.close();
      }

      receiversById.clear();
    },

    inspect: () => baseReceiverId,
  };

  const baseSender = base.connect(baseReader);

  mx = {
    connect: (outgoingReceiver) => {
      const id = generateId();
      if (receiversById.has(id)) throw new Error(`id conflict`);

      receiversById.set(id, outgoingReceiver);
      baseSender.send({ id, tag: "open" });

      console.debug(
        `connect(${id}) -> R=${outgoingReceiver.inspect()} S=${id} (count=${receiversById.size})`,
      );

      return {
        send: (message) => baseSender.send({ id, tag: "message", message }),
        close: () => {
          receiversById.delete(id);
          console.debug(
            `${multiplexerId} ${id} closed (count=${receiversById.size})`,
          );
          baseSender.send({ id, tag: "close" });
          outgoingReceiver.close();
        },
        inspect: () => id,
      };
    },
    inspect: () => multiplexerId,
  };

  console.debug(
    `multiplexer(${base.inspect()}) -> ${multiplexerId} BR=${baseReceiverId} BS=${baseSender.inspect()}`,
  );

  return mx;
};
