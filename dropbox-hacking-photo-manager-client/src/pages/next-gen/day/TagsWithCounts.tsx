import React, { type CSSProperties } from "react";
import logRender from "@lib/logRender";

const TagsWithCounts = ({
  tags,
  style,
}: {
  tags: Record<string, number>;
  style?: CSSProperties;
}) => {
  return (
    <div className="tags" style={style}>
      {Object.entries(tags)
        .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([tag, count], index) => (
          <span key={index} className={`tag tag-${tag}`}>
            {tag} ({count})
          </span>
        ))}
    </div>
  );
};

export default logRender(TagsWithCounts);
