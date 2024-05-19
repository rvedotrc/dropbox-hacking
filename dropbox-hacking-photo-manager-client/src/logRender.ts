import { FunctionComponent, PropsWithChildren } from "react";

type F<P> = FunctionComponent<P>;

const makeSequence = () => {
  let n = 1;
  return () => n++;
};

const nameSequence = makeSequence();

const logRender = <P extends PropsWithChildren<object>>(f: F<P>): F<P> => {
  const functionName = f.displayName || f.name || `anonymous${nameSequence()}`;
  const renderSequence = makeSequence();

  const r: F<P> = (props: P) => {
    console.log(`render ${functionName} #${renderSequence()}`);
    return f(props);
  };

  r.displayName = f.displayName;

  return r;
};

export default logRender;
