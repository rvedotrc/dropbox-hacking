import logRender from "@lib/logRender";
import * as React from "react";

const TwelveMonths = (props: {
  year: number;
  renderMonth: (y: number, m: number) => React.ReactNode;
}) => (
  <div className="twelveMonths">
    {[...Array(12).keys()].map((month) => (
      <div className="oneOfTwelveMonths" key={month}>
        {props.renderMonth(props.year, month)}
      </div>
    ))}
  </div>
);

export default logRender(TwelveMonths);
