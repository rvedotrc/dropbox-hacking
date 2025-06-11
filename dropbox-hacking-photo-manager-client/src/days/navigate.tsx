import * as React from "react";

import SamePageLink from "../samePageLink";

const navigation = (): React.ReactElement | null => (
  <p>
    <SamePageLink state={{ route: "calendar" }}>Calendar</SamePageLink>
    {" | "}
    <SamePageLink state={{ route: "days" }}>
      List of days (with sample pics)
    </SamePageLink>
    {" | "}
    <SamePageLink state={{ route: "days-plain" }}>
      List of days (plain)
    </SamePageLink>
    {" | "}
    <SamePageLink state={{ route: "stats" }}>Stats</SamePageLink>
    {" /// "}
    <SamePageLink state={{ route: "next-gen/basic-counts" }}>
      Basic counts
    </SamePageLink>
    {" | "}
    <SamePageLink state={{ route: "next-gen/list-of-days/without-samples" }}>
      List of days
    </SamePageLink>
  </p>
);

export default navigation;
