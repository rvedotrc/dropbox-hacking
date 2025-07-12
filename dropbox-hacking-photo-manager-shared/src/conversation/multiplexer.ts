import { generateId } from "./id.js";
import type { IOHandler, Receiver } from "./types.js";

export type IDHolder = {
  id: string;
};

export type WrappedPayload<T> =
  | { readonly tag: "open" }
  | { readonly tag: "message"; readonly message: T }
  | { readonly tag: "close" };

export const multiplexer = <I, O>(
  underlying: IOHandler<
    IDHolder & WrappedPayload<I>,
    IDHolder & WrappedPayload<O>
  >,
  listener: (handler: IOHandler<I, O>) => void,
): IOHandler<I, O> => {
  const receiversById: Map<string, Receiver<I>> = new Map();

  const underlyingReader: Receiver<IDHolder & WrappedPayload<I>> = {
    receive: (underlyingMessage) => {
      console.debug("mx receive", underlyingMessage.id, underlyingMessage.tag);

      if (underlyingMessage.tag === "open") {
        if (receiversById.has(underlyingMessage.id)) {
          throw new Error("Duplicate multiplexer ID");
        } else {
          listener((newReader) => {
            if (receiversById.has(underlyingMessage.id)) {
              throw new Error("Duplicate multiplexer ID");
            }

            console.debug("mx accepted connection", underlyingMessage.id);
            receiversById.set(underlyingMessage.id, newReader);

            return {
              send: (message) =>
                underlyingSender.send({
                  tag: "message",
                  id: underlyingMessage.id,
                  message,
                }),
              close: () => {
                receiversById.delete(underlyingMessage.id);
                underlyingSender.send({
                  tag: "close",
                  id: underlyingMessage.id,
                });
                newReader.close();
              },
            };
          });
        }
      } else if (underlyingMessage.tag === "message") {
        const receiver = receiversById.get(underlyingMessage.id);

        if (receiver) {
          receiver.receive(underlyingMessage.message);
        } else {
          console.error(
            "message for non-open conversation",
            underlyingMessage.id,
          );
        }
      } else if (underlyingMessage.tag === "close") {
        const receiver = receiversById.get(underlyingMessage.id);

        if (receiver) {
          receiversById.delete(underlyingMessage.id);
          receiver.close();
        } else {
          console.error("close of non-open conversation", underlyingMessage.id);
        }
      } else {
        throw new Error(`Bad tag in payload`, underlyingMessage);
      }
    },

    close: () => {
      for (const receiver of receiversById.values()) receiver.close();
      receiversById.clear();
    },
  };

  const underlyingSender = underlying(underlyingReader);

  return (receiver) => {
    const id = generateId();
    if (receiversById.has(id)) throw new Error(`id conflict`);

    receiversById.set(id, receiver);
    underlyingSender.send({ id, tag: "open" });

    return {
      send: (message) => underlyingSender.send({ id, tag: "message", message }),
      close: () => {
        receiversById.delete(id);
        receiver.close();
      },
    };
  };
};
