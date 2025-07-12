import { useLatestValue } from "../useLatestValue";
import { useAdditionalFeeds } from "./additionalFeeds";

export const useCountsByDate = () =>
  useLatestValue(useAdditionalFeeds()?.countsByDate);
