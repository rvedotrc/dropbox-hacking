export interface Emittable<T> {
  emit: (event: T) => void;
}

export type Listener<T> = (event: T) => void;

// Modes to consider implementing:
// - synchronous sequential (stop on error)
// - async sequential (stop on error)
// - async parallel
// - fire and forget

export interface Subscribable<T> {
  subscribe: (listener: Listener<T>) => () => void;
  unsubscribe: (listener: Listener<T>) => void;
}

export const makeEmittableSubscribable = <T>(): [
  Emittable<T>,
  Subscribable<T>,
] => {
  const listeners: Listener<T>[] = [];

  const emittable: Emittable<T> = {
    emit: (event: T): void => {
      for (const listener of listeners) {
        setTimeout(() => listener(event), 0);
      }
    },
  };

  const subscribable: Subscribable<T> = {
    subscribe: (listener: Listener<T>): (() => void) => {
      if (!listeners.includes(listener)) listeners.push(listener);
      return () => subscribable.unsubscribe(listener);
    },
    unsubscribe: (listener: Listener<T>): void => {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    },
  };

  return [emittable, subscribable];
};
