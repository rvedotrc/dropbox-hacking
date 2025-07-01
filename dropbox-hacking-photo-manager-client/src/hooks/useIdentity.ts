import { useMemo } from "react";

let nextId = 0;

export const useIdentity = () => {
  const id = useMemo(() => nextId++, []);

  const renderSeqGenerator = useMemo(() => {
    let nextRenderSeq = 0;
    return () => nextRenderSeq++;
  }, []);

  return { id, renderSeq: renderSeqGenerator() };
};
