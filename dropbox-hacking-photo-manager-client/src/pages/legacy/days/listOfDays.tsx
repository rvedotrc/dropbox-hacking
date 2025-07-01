import * as React from "react";
import { useEffect } from "react";

import { useCountsByDate } from "@hooks/legacyRxFeeds/countsByDateContext";
import logRender from "@lib/logRender";
import ListOfDaysWithData from "./listOfDaysWithData";
import { useLatestValue } from "@hooks/useLatestValue";
import { useRxFeedsViaMultiplexer } from "@hooks/legacyRxFeeds/rxRecordFeedContext";

const ListOfDays = ({
  withSamples,
}: {
  withSamples: boolean;
}): React.ReactElement | null => {
  const countsByDate = useCountsByDate();

  const latestReplayImage = useLatestValue(useRxFeedsViaMultiplexer()?.days);
  const dayMetadata = latestReplayImage
    ? Object.values(latestReplayImage.image)
    : undefined;

  useEffect(() => {
    document.title = "DPM - Days";
  }, []);

  if (!countsByDate || !dayMetadata) {
    return <div>Loading LOD ...</div>;
  } else {
    return (
      <ListOfDaysWithData
        countsByDate={countsByDate}
        dayMetadata={dayMetadata}
        withSamples={withSamples}
      />
    );
  }
};

export default logRender(ListOfDays);
