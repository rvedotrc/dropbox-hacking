import { Payload, urlForState } from "dropbox-hacking-photo-manager-shared";
import * as React from "react";

import { useRouter } from "./context/routingContext";

const samePageLink = ({
  state,
  ...props
}: {
  state: Payload;
} & Omit<
  React.JSX.IntrinsicElements["a"],
  "href"
>): React.ReactElement | null => {
  const router = useRouter();

  const href = urlForState(state);

  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        e.persist();
        if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
          return;
        }

        e.preventDefault();
        window.history.pushState(state, "unused", href);
        router.switchToPage(state);
      }}
    >
      {props.children}
    </a>
  );
};

export default samePageLink;
