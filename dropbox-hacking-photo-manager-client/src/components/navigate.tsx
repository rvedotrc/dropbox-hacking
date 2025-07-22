import SamePageLink from "@components/samePageLink";
import * as React from "react";

const navigation = (): React.ReactElement | null => (
  <p>
    <SamePageLink
      routeState={{ route: "route/next-gen/list-of-days/without-samples" }}
    >
      List of days
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/video" }}>
      Video
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/basic-counts" }}>
      Basic counts
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/tags", tag: null }}>
      tags
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/fsck" }}>
      fsck
    </SamePageLink>
    {" | "}
    <SamePageLink routeState={{ route: "route/next-gen/exif-explorer" }}>
      EXIF explorer
    </SamePageLink>
    {" | "}
    <SamePageLink
      routeState={{
        route: "route/next-gen/mediainfo-explorer",
        streamKind: null,
      }}
    >
      MediaInfo explorer
    </SamePageLink>

    {" /// "}

    <button
      onClick={() =>
        void document
          .getElementById("react_container")!
          .requestFullscreen({ navigationUI: "show" })
      }
    >
      Full screen
    </button>
  </p>
);

export default navigation;
