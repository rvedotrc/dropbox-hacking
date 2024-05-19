import * as React from "react";
import { createRoot } from "react-dom/client";

import Calendar from "./days/calendar";
import Day from "./day";
import Photo from "./photo";
import ListOfDays from "./days/listOfDays";
import { Payload } from "dropbox-hacking-photo-manager-shared";
import { useEffect, useState } from "react";
import ListOfDaysNoPics from "./days/listOfDaysNoPics";
import countsByDateContext from "./context/countsByDateContext";
import daysMetadataContext from "./context/daysMetadataContext";
import eventEmitterContext from "./context/eventEmitterContext";

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
    const listener = (event: PopStateEvent) => setState(event.state);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

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
