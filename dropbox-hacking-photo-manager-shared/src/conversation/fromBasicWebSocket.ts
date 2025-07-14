import { spy } from "./spy.js";
import type { IOHandler } from "./types.js";

export interface BasicWebSocket<S, I, O> {
  readonly OPEN: S;
  readonly readyState: S;
  addEventListener(eventName: "close", listener: () => void): void;
  addEventListener(
    eventName: "message",
    listener: (message: { data: I }) => void,
  ): void;
  removeEventListener(eventName: "close", listener: () => void): void;
  removeEventListener(
    eventName: "message",
    listener: (message: { data: I }) => void,
  ): void;
  send(message: O): void; // TODO error handling
  close(): void;
}

export const fromBasicWebSocket = <S, I, O>(
  webSocket: BasicWebSocket<S, I, O>,
): IOHandler<I, O> => {
  return spy(
    {
      connect: (receiver) => {
        if (webSocket.readyState !== webSocket.OPEN)
          throw new Error("Socket is not OPEN");

        const closeListener = () => {
          webSocket.removeEventListener("close", closeListener);
          webSocket.removeEventListener("message", messageListener);
          receiver.close();
        };

        const messageListener = (message: { data: I }) => {
          receiver.receive(message.data);
        };

        webSocket.addEventListener("close", closeListener);
        webSocket.addEventListener("message", messageListener);

        return {
          send: (payload) => webSocket.send(payload),
          close: () => webSocket.close(),
          inspect: () => ``,
        };
      },
      inspect: () => ``,
    },
    "mx-on-websocket",
  );
};
