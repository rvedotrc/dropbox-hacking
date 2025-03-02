export interface Incoming<T> {
  readonly receive: (message: T) => void;
  readonly close: () => void;
}

export interface Outgoing<T> {
  readonly send: (message: T) => void;
  readonly close: () => void; // triggers the reader's close()
}

export interface IOHandler<I, O> {
  (reader: Incoming<I>): Outgoing<O>;
}
