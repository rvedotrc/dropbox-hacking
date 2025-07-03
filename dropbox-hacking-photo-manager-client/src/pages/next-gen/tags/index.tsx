import React from "react";
import SingleTag from "./singleTag";
import ListOfTags from "./listOfTags";

export default ({ tag }: { tag: string | null }) =>
  tag ? <SingleTag tag={tag} /> : <ListOfTags />;
