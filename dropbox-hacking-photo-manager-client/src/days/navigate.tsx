import * as React from "react";

import SamePageLink from "../samePageLink";

const navigation = (): React.ReactElement | null => (
  <p>
    <SamePageLink href={"/calendar"} state={{ route: "calendar" }}>
      Calendar
    </SamePageLink>
    {" | "}
    <SamePageLink href={"/days"} state={{ route: "days" }}>
      List of days (with sample pics)
    </SamePageLink>
    {" | "}
    <SamePageLink href={"/days/plain"} state={{ route: "days-plain" }}>
      List of days (plain)
    </SamePageLink>
    {" | "}
    <SamePageLink href={"/stats"} state={{ route: "stats" }}>
      Stats
    </SamePageLink>
  </p>
);

export default navigation;
