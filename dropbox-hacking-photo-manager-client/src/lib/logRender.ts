import { FunctionComponent, PropsWithChildren } from "react";

type F<P> = FunctionComponent<P>;

const seen = Symbol("logRender-seen");

const makeSequence = () => {
  let n = 1;
  return () => n++;
};

const doLog = true;

const nameSequence = makeSequence();

const logRender = <P extends PropsWithChildren<object>>(f: F<P>): F<P> => {
  const functionName = f.displayName || f.name || `anonymous${nameSequence()}`;
  const renderSequence = makeSequence();

  const r: F<P> = (props: P) => {
    if (doLog) {
      const seenMap = Object.entries(props as object)
        .toSorted((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => {
          if (
            (typeof v === "object" && v !== null) ||
            typeof v === "function"
          ) {
            if (seen in v) return `${k}=seen`;

            Object.defineProperty(v, seen, { value: true });

            return `${k}=NEW`;
          } else {
            return `${k}=-`;
          }
        })
        .join(" ");
      console.log(`render ${functionName} #${renderSequence()} ${seenMap}`);
    }
    return f(props);
  };

  r.displayName = f.displayName;

  return r;
};

export default logRender;
