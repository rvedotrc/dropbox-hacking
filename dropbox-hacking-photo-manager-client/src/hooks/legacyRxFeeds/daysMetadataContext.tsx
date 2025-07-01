import { useRxFeedsViaMultiplexer } from "./rxRecordFeedContext";
import { map } from "rxjs";
import { useLatestValue } from "@hooks/useLatestValue";
import { useMemo } from "react";

export const useDays = () => {
  const feeds = useRxFeedsViaMultiplexer();

  return useLatestValue(
    useMemo(
      () => feeds?.days?.pipe?.(map((r) => Object.values(r.image))),
      [feeds],
    ),
  );
};
