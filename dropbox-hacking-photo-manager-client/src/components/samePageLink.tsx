import { RouteState, urlForState } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import { useRouter } from "@/context/routingContext";

const samePageLink = ({
  routeState,
  ...props
}: {
  routeState: RouteState;
} & Omit<
  React.JSX.IntrinsicElements["a"],
  "href"
>): React.ReactElement | null => {
  const router = useRouter();

  const href = urlForState(routeState);

  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        e.persist();
        if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
          return;
        }

        document.title = "UNSET TITLE";
        e.preventDefault();
        window.history.pushState(routeState, "unused", href);
        router.switchToPage(routeState);
      }}
    >
      {props.children}
    </a>
  );
};

export default samePageLink;
