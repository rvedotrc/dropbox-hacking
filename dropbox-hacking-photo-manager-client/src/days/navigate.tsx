import SamePageLink from "../samePageLink";
import * as React from "react";

const navigation = () => (
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
  </p>
);

export default navigation;
