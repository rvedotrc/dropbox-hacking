import { useAdditionalFeeds } from "./additionalFeeds";
import { useLatestValue } from "../useLatestValue";

export const useCountsByDate = () =>
  useLatestValue(useAdditionalFeeds()?.countsByDate);
