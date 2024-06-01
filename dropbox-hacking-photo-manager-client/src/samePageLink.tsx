import * as React from "react";
import { Payload } from "dropbox-hacking-photo-manager-shared";
import { useRouter } from "./context/routingContext";

const samePageLink = ({
  state,
  ...props
}: {
  state: Payload;
} & JSX.IntrinsicElements["a"]) => {
  const router = useRouter();

  return (
    <a
      {...props}
      onClick={(e) => {
        e.persist();
        console.log("SPL onclick", e);
        if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
          console.log("modifier used, ignoring");
          return;
        }

        console.log("no modifier used, using pushState");
        e.preventDefault();
        window.history.pushState(state, "unused", props.href);
        router.switchToPage(state);
      }}
    >
      {props.children}
    </a>
  );
};

export default samePageLink;
