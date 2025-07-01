import * as React from "react";

import SamePageLink from "@/components/samePageLink";

const navigation = (): React.ReactElement | null => (
  <p>
    <SamePageLink
      routeState={{ route: "route/next-gen/list-of-days/without-samples" }}
    >
      List of days
    </SamePageLink>

    {" | "}

    <SamePageLink routeState={{ route: "route/next-gen/basic-counts" }}>
      Basic counts
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/fsck" }}>
      fsck
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/exif-explorer" }}>
      EXIF explorer
    </SamePageLink>

    {" /// "}

    <SamePageLink routeState={{ route: "calendar" }}>Calendar</SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "days" }}>
      List of days (with sample pics)
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "days-plain" }}>
      List of days (plain)
    </SamePageLink>
    {/* RVE-add-route */}
  </p>
);

export default navigation;
