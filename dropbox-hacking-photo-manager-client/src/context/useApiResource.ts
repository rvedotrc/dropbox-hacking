import { useEffect, useMemo, useState } from "react";

import { Either, left, right } from "../fp";

export type Result<T> = Either<unknown, T>;
type FetchPromise = Promise<unknown>;
type State<T> = {
  result: Result<T> | undefined;
  fetchPromise: FetchPromise | undefined;
};
export type ApiResource<T> = {
  result: Result<T> | undefined;
  reset: () => void;
  refresh: () => void;
};

// Doesn't respect changing of the URL
export default <T>({ url }: { url: string }): ApiResource<T> => {
  const [state, setState] = useState<State<T>>({
    result: undefined,
    fetchPromise: undefined,
  });

  const initRequest = () => {
    const fetchPromise = fetch(url)
      .then((r) => r.json() as T)
      .then(
        (data) => {
          setState((before) =>
            before.fetchPromise === fetchPromise
              ? { result: right(data), fetchPromise: undefined }
              : before,
          );
        },
        (error) => {
          setState((before) =>
            before.fetchPromise === fetchPromise
              ? { result: left(error), fetchPromise: undefined }
              : before,
          );
        },
      );

    // Set the promise but preserve the result
    setState((before) => ({ ...before, fetchPromise }));
  };

  useEffect(() => {
    if (state.fetchPromise === undefined && state.result === undefined) {
      initRequest();
    }
  }, []);

  const reset = useMemo(
    () => () => {
      setState({ result: undefined, fetchPromise: undefined });
      initRequest();
    },
    [],
  );

  const refresh = useMemo(
    () => () => {
      initRequest();
    },
    [],
  );

  return {
    result: state.result,
    reset,
    refresh,
  };
};
