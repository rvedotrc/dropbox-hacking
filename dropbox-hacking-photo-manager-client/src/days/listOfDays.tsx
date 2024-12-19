import * as React from "react";
import { useEffect } from "react";

import logRender from "../logRender";
import { useCountsByDate } from "../context/countsByDateContext";
import { useDays } from "../context/daysMetadataContext";
import ListOfDaysWithData from "./listOfDaysWithData";

const ListOfDays = ({ withSamples }: { withSamples: boolean }) => {
  const countsByDate = useCountsByDate();
  const dayMetadata = useDays();

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
