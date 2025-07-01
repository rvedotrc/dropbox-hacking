import { useEffect, useState } from "react";
import { ReplaySubject, type Observable } from "rxjs";

export const useLatestValue = <T>(
  obs: Observable<T> | undefined,
): T | undefined => {
  const [value, setValue] = useState<T | undefined>(() => {
    // FIXME: shitty hack
    if (obs instanceof ReplaySubject) {
      const o = obs as object;
      if ("_buffer" in o && Array.isArray(o._buffer)) {
        const typedObs = o as unknown as { readonly _buffer: readonly T[] };
        if (typedObs._buffer.length > 0) {
          return typedObs._buffer[typedObs._buffer.length - 1];
        }
      }
    }

    return undefined;
  });

  useEffect(() => {
    if (!obs) {
      setValue(undefined);
      return;
    }

    const subscription = obs.subscribe({
      next: (v) => setValue(v),
      complete: () => setValue(undefined),
      error: (_error) => setValue(undefined),
    });

    return () => subscription.unsubscribe();
  }, [obs]);

  return value;
};
