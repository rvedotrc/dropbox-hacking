export interface Receiver<T> {
  readonly receive: (message: T) => void;
  readonly close: () => void;
  readonly inspect: () => string;
}

export interface Sender<T> {
  readonly send: (message: T) => void;
  readonly close: () => void; // triggers the receiver's close()
  readonly inspect: () => string;
}

export interface IOHandler<I, O> {
  readonly connect: (receiver: Receiver<I>) => Sender<O>;
  readonly inspect: () => string;
}
