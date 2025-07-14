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
  listener: (handler: IOHandler<I, O>) => void,
): IOHandler<I, O> => {
  const receiversById: Map<string, Receiver<I>> = new Map();
  let mx = { inspect: () => "[placeholder]" } as IOHandler<I, O>;

  const baseReader: Receiver<IDHolder & WrappedPayload<I>> = {
    receive: (mxControlMessage) => {
      const { id, tag } = mxControlMessage;
      console.debug("mx receive", id, tag);

      if (tag === "open") {
        if (receiversById.has(id)) {
          throw new Error("Duplicate multiplexer ID");
        } else {
          listener({
            connect: (incomingReceiver) => {
              if (receiversById.has(id)) {
                throw new Error("Duplicate multiplexer ID");
              }

              console.debug("mx accepted connection", id);
              receiversById.set(mxControlMessage.id, incomingReceiver);

              const incomingSender: Sender<O> = {
                send: (message) =>
                  baseSender.send({
                    tag: "message",
                    id,
                    message,
                  }),
                close: () => {
                  console.debug("mx connection sending close", id);
                  receiversById.delete(id);
                  baseSender.send({
                    tag: "close",
                    id,
                  });
                  incomingReceiver.close();
                },
                inspect: () =>
                  `<Sender for incoming ${id} over ${mx.inspect()}>`,
              };

              return incomingSender;
            },
            inspect: () =>
              `<Connector for incoming ${id} over ${mx.inspect()}>`,
          });
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
          console.debug("mx connection received close", id);
          receiversById.delete(mxControlMessage.id);
          receiver.close();
        } else {
          console.error("close of non-open conversation", id);
        }
      }
    },

    close: () => {
      for (const receiver of receiversById.values()) receiver.close();
      receiversById.clear();
    },

    inspect: () => `<BaseReader for ${mx.inspect()}>`,
  };

  const baseSender = base.connect(baseReader);

  mx = {
    connect: (outgoingReceiver) => {
      const id = generateId();
      if (receiversById.has(id)) throw new Error(`id conflict`);

      receiversById.set(id, outgoingReceiver);
      baseSender.send({ id, tag: "open" });

      return {
        send: (message) => baseSender.send({ id, tag: "message", message }),
        close: () => {
          console.debug("mx connection sending close", id);
          receiversById.delete(id);
          baseSender.send({ id, tag: "close" });
          outgoingReceiver.close();
        },
        inspect: () => `<Sender for ${id} over ${mx.inspect()}>`,
      };
    },
    inspect: () => `<Multiplexer over ${base.inspect()}>`,
  };

  return mx;
};
