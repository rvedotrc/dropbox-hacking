import * as React from "react";
import { Payload } from "dropbox-hacking-photo-manager-shared";

const samePageLink = ({
  state,
  setState,
  ...props
}: {
  state: Payload;
  setState: (state: Payload) => void;
} & JSX.IntrinsicElements["a"]) => (
  <a
    {...props}
    onClick={(e) => {
      e.preventDefault();
      window.history.pushState(state, "unused", props.href);
      setState(state);
    }}
  >
    {props.children}
  </a>
);

export default samePageLink;
