import { useEffect, useState } from "react";
import { Either, left, right } from "./fp";

type Result<T> = Either<any, T>;
type FetchPromise = Promise<unknown>;
type State<T> = {
  result: Result<T> | undefined;
  fetchPromise: FetchPromise | undefined;
};

// Doesn't respect changing of the URL
export default <T>({ url }: { url: string }) => {
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

  return {
    result: state.result,
    reset: () => {
      setState({ result: undefined, fetchPromise: undefined });
      initRequest();
    },
    refresh: () => {
      initRequest();
    },
  };
};
