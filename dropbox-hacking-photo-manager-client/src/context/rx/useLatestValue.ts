import { useEffect, useState } from "react";
import { type Observable } from "rxjs";

export const useLatestValue = <T>(
  obs: Observable<T> | undefined,
): T | undefined => {
  const [value, setValue] = useState<T>();

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
