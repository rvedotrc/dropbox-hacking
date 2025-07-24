import { useStyleSheet } from "@hooks/useStyleSheet";
import logRender from "@lib/logRender";
import React, { type ReactNode, useMemo } from "react";

type SummaryRow = {
  readonly key: ReactNode;
  readonly value: ReactNode;
};

type SummarySection = {
  readonly name: ReactNode;
  readonly rows: readonly SummaryRow[];
};

type SummaryTable = {
  readonly sections: readonly SummarySection[];
};

const SummaryRow = ({
  summaryRow,
  row,
}: {
  summaryRow: SummaryRow;
  row: number;
}) => {
  return (
    <>
      <div
        className="k2"
        style={{
          gridRow: row,
          gridColumn: 2,
        }}
      >
        {summaryRow.key}
      </div>
      <div
        className="v"
        style={{
          gridRow: row,
          gridColumn: 3,
        }}
      >
        {summaryRow.value}
      </div>
    </>
  );
};

const SummarySection = ({
  section,
  rows,
}: {
  section: SummarySection;
  rows: number;
}) => {
  return (
    <>
      <div
        className="k1"
        style={{
          gridRowStart: rows + 1,
          gridRowEnd: rows + 1 + section.rows.length,
        }}
      >
        {section.name}
      </div>

      {section.rows.map((summaryRow, index) => (
        <SummaryRow
          key={index}
          summaryRow={summaryRow}
          row={rows + index + 1}
        />
      ))}
    </>
  );
};

const SummaryTable = ({ table: summaryTable }: { table: SummaryTable }) => {
  if (summaryTable.sections.flatMap((s) => s.rows).length === 0) return;

  const tableId = useMemo(
    () => "X_" + crypto.randomUUID().replaceAll(/-/g, "_"),
    [],
  );

  const cssText = `
    #${tableId} {
      display: grid;
      grid-auto-flow: column;
      width: fit-content;
    }

    #${tableId} > div {
      border-radius: 0.4em;
      margin: 0.1em;
      padding: 0.2em;
      padding-inline: 0.6em;
      text-align: left;
      text-wrap: none;
    }

    #${tableId} > div.k1 {
      grid-column: 1;
      background: purple;
      color: white;
    }

    #${tableId} > div.k2 {
      grid-column: 2;
      background: green;
      color: white;
    }

    #${tableId} > div.v {
      grid-column: 3;
      background: blue;
      color: white;
    }
  `;

  useStyleSheet({ cssText });

  return (
    <div id={tableId}>
      {summaryTable.sections.map((s, i) => (
        <SummarySection
          key={i}
          section={s}
          rows={summaryTable.sections.slice(0, i).flatMap((t) => t.rows).length}
        />
      ))}
    </div>
  );
};

export default logRender(SummaryTable);
