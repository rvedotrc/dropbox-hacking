export const simplePromiseRetrier = <T>(
  makePromise: () => Promise<T>,
  tag?: string,
): Promise<T> => {
  let attempt = 0;

  const tryAgain: () => Promise<T> = () =>
    makePromise().catch((err) => {
      console.error(
        `attempt #${attempt} of ${tag || "anonymous promise"} failed`,
        err,
      );
      ++attempt;
      return tryAgain();
    });

  return tryAgain();
};
