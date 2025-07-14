export interface Receiver<T> {
  readonly receive: (message: T) => void;
  readonly close: () => void;
}

export interface Sender<T> {
  readonly send: (message: T) => void;
  readonly close: () => void; // triggers the receiver's close()
}

export interface IOHandler<I, O> {
  readonly connect: (receiver: Receiver<I>) => Sender<O>;
}
