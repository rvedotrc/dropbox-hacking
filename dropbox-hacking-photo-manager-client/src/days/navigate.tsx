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
    {" /// "}
    <SamePageLink
      href={"/next-gen/basic-counts"}
      state={{ route: "next-gen/basic-counts" }}
    >
      Basic counts
    </SamePageLink>
    {" | "}
    <SamePageLink
      href={"/next-gen/list-of-days/without-samples"}
      state={{ route: "next-gen/list-of-days/without-samples" }}
    >
      List of days
    </SamePageLink>
  </p>
);

export default navigation;
