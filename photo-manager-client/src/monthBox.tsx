import * as React from "react";

const MonthBox = (props: {
  year: number;
  month: number;
  renderDay: (y: number, m: number, d: number) => React.ReactFragment;
}) => {
  const { year, month, renderDay } = props;

  const fragments: React.ReactFragment[] = [];

  let day = 1;
  let row = 0;

  // eslint-disable-next-line no-constant-condition
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

export default MonthBox;
