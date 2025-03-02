import { generateId } from "./id.js";
import type { Incoming, IOHandler } from "./types.js";

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
  const readersById: Map<string, Incoming<I>> = new Map();

  const underlyingReader: Incoming<IDHolder & WrappedPayload<I>> = {
    receive: (underlyingMessage) => {
      if (underlyingMessage.tag === "open") {
        if (readersById.has(underlyingMessage.id)) {
          throw new Error("Duplicate multiplexer ID");
        } else {
          listener((newReader) => {
            if (readersById.has(underlyingMessage.id)) {
              throw new Error("Duplicate multiplexer ID");
            }

            readersById.set(underlyingMessage.id, newReader);

            return {
              send: (message) =>
                underlyingWriter.send({
                  tag: "message",
                  id: underlyingMessage.id,
                  message,
                }),
              close: () => {
                readersById.delete(underlyingMessage.id);
                underlyingWriter.send({
                  tag: "close",
                  id: underlyingMessage.id,
                });
                newReader.close();
              },
            };
          });
        }
      } else if (underlyingMessage.tag === "message") {
        const reader = readersById.get(underlyingMessage.id);

        if (reader) {
          reader.receive(underlyingMessage.message);
        } else {
          console.error(
            "message for non-open conversation",
            underlyingMessage.id,
          );
        }
      } else if (underlyingMessage.tag === "close") {
        const reader = readersById.get(underlyingMessage.id);

        if (reader) {
          readersById.delete(underlyingMessage.id);
          reader.close();
        } else {
          console.error("close of non-open conversation", underlyingMessage.id);
        }
      } else {
        throw new Error(`Bad tag in payload`, underlyingMessage);
      }
    },

    close: () => {
      for (const reader of readersById.values()) reader.close();
      readersById.clear();
    },
  };

  const underlyingWriter = underlying(underlyingReader);

  return (reader) => {
    const id = generateId();
    if (readersById.has(id)) throw new Error(`id conflict`);

    readersById.set(id, reader);
    underlyingWriter.send({ id, tag: "open" });

    return {
      send: (message) => underlyingWriter.send({ id, tag: "message", message }),
      close: () => {
        readersById.delete(id);
        reader.close();
      },
    };
  };
};
