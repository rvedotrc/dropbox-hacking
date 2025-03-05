import { useAdditionalFeeds } from "./rx/additionalFeeds";
import { useLatestValue } from "./rx/useLatestValue";

export const useCountsByDate = () =>
  useLatestValue(useAdditionalFeeds()?.countsByDate);
