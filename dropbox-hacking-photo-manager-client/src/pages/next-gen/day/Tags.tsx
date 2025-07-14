import logRender from "@lib/logRender";
import React, { type CSSProperties } from "react";

const Tags = ({ tags, style }: { tags: string[]; style?: CSSProperties }) => {
  return (
    <div className="tags" style={style}>
      {tags.map((tag, index) => (
        <span key={index} className={`tag tag-${tag}`}>
          {tag}
        </span>
      ))}
    </div>
  );
};

export default logRender(Tags);
