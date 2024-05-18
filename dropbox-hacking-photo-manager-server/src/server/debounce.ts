const makeSafe =
  (fn: () => void, name: string): (() => void) =>
  () => {
    try {
      fn();
    } catch (err) {
      console.error(`Error from ${name} function`, err);
    }
  };

const waitThenRun = (
  fn: () => void,
  delay: number,
  name?: string,
): (() => void) => {
  const safeFn = makeSafe(fn, `waitThenRun ${name}`);
  let timer: NodeJS.Timeout | undefined = undefined;

  return (): void => {
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        safeFn();
      }, delay);
    } else {
      // do nothing
    }
  };
};

const runThenWait = (
  fn: () => void,
  delay: number,
  name?: string,
): (() => void) => {
  const safeFn = makeSafe(fn, `runThenWait ${name}`);
  let dirty = false;
  let timer: NodeJS.Timeout | undefined = undefined;

  const fire = () => {
    timer = setTimeout(() => {
      timer = undefined;
      if (dirty) fire();
    }, delay);

    dirty = false;
    safeFn();
  };

  return (): void => {
    if (timer === undefined) {
      fire();
    } else {
      dirty = true;
    }
  };
};

export default {
  makeSafe,
  runThenWait,
  waitThenRun,
};
