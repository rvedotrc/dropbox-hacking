import * as React from "react";
import { useEffect } from "react";

import { useCountsByDate } from "../context/countsByDateContext";
import logRender from "../logRender";
import ListOfDaysWithData from "./listOfDaysWithData";
import { useLatestValue } from "../context/rx/useLatestValue";
import { useRxFeedsViaMultiplexer } from "../context/rx/rxRecordFeedContext";

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
