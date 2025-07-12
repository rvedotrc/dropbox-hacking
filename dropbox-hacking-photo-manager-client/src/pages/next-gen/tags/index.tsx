import React from "react";

import ListOfTags from "./listOfTags";
import SingleTag from "./singleTag";

export default ({ tag }: { tag: string | null }) =>
  tag ? <SingleTag tag={tag} /> : <ListOfTags />;
