import * as React from "react";

import logRender from "@lib/logRender";

const MonthBox = (props: {
  year: number;
  month: number;
  renderDay: (y: number, m: number, d: number) => React.ReactNode;
}) => {
  const { year, month, renderDay } = props;

  const fragments: React.ReactNode[] = [];

  let day = 1;
  let row = 0;

  while (true) {
    const date = new Date(Date.UTC(year, month, day));
    if (date.getMonth() !== month) break;

    const column = date.getDay();

    fragments.push(
      <div
        key={date.getTime()}
        className={`dayInMonthBox row${row + 1} col${column + 1}`}
        style={{ gridRow: row + 1, gridColumn: column + 1 }}
      >
        {renderDay(year, month, day)}
      </div>,
    );

    if (column === 6) ++row;
    ++day;
  }

  return <div className="monthBox">{fragments}</div>;
};

export default logRender(MonthBox);
