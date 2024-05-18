import * as React from "react";
import { createRoot } from "react-dom/client";

import Calendar from "./calendar";
import Day from "./day";
import Photo from "./photo";
import ListOfDays from "./listOfDays";
import { Payload } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useState } from "react";
import countsByDateContext from "./countsByDateContext";
import daysMetadataContext from "./daysMetadataContext";
import eventEmitterContext from "./eventEmitterContext";
import ListOfDaysNoPics from "./listOfDaysNoPics";

const toRender = ({
  payload,
  setState,
}: {
  payload: Payload;
  setState: (payload: Payload) => void;
}) => {
  if (payload.route === "calendar") return <Calendar setState={setState} />;
  if (payload.route === "days") return <ListOfDays setState={setState} />;
  if (payload.route === "days-plain")
    return <ListOfDaysNoPics setState={setState} />;
  if (payload.route === "day")
    return <Day setState={setState} date={payload.date} />;
  if (payload.route === "photo")
    return <Photo setState={setState} rev={payload.rev} />;
  return <span>Routing error</span>;
};

const Root = ({ initialState }: { initialState: Payload }) => {
  const [state, setState] = useState(initialState);

  // if "popState" happens, render that state
  useEffect(() => {
    const listener = (event: PopStateEvent) => {
      console.debug("popstate", event);
      setState(event.state);
    };
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  useEffect(() => {
    console.log(
      `root render for ${window.location.href} in window ${
        (window as any).my_id
      } document ${(document as any).my_id}`,
    );
  });

  return (
    <eventEmitterContext.defaultProvider>
      <countsByDateContext.defaultProvider>
        <daysMetadataContext.defaultProvider>
          {toRender({ payload: state, setState })}
        </daysMetadataContext.defaultProvider>
      </countsByDateContext.defaultProvider>
    </eventEmitterContext.defaultProvider>
  );
};

document.addEventListener("DOMContentLoaded", () => {
  (window as any).my_id ||= new Date().getTime();
  (document as any).my_id ||= new Date().getTime();
  console.log(
    `DOM loaded for ${window.location.href} in window ${
      (window as any).my_id
    } document ${(document as any).my_id}`,
  );
  const ele = document.getElementById("payload-script");

  if (ele) {
    const payload = JSON.parse(ele.getAttribute("data-payload") || "null");
    const container = document.getElementById("react_container");
    if (container) {
      window.history.replaceState(payload, "unused");
      createRoot(container!).render(<Root initialState={payload} />);
    }
  }
});
