import * as React from "react";

import logRender from "../../logRender";

const TwelveMonths = (props: {
  year: number;
  renderMonth: (y: number, m: number) => React.ReactFragment;
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
