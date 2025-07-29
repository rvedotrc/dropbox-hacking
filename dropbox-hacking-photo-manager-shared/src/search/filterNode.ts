export type FilterNode = Leaf | Bool;

export type Leaf =
  | Leaf_Tag
  | Leaf_TagLoose
  | Leaf_TagCount
  | Leaf_Timestamp
  | Leaf_Text
  | Leaf_MediaType
  | Leaf_Duration
  | Leaf_HasGPS
  | Leaf_Path
  | Leaf_FileId
  | Leaf_FileRev;

type Leaf_Tag = {
  readonly type: "tag";
  readonly tag: string;
};

type Leaf_TagLoose = {
  readonly type: "tag-loose";
  readonly q: string;
};

type Leaf_TagCount = {
  readonly type: "tag_count";
  readonly tagCount: number;
  readonly operand: ">" | "<";
};

type Leaf_Timestamp = {
  readonly type: "timestamp";
  readonly timestamp: string;
  readonly operand: ">" | "<";
};

type Leaf_Text = {
  readonly type: "text";
  readonly text: string;
};

type Leaf_MediaType = {
  readonly type: "media_type";
  readonly mediaType: "image" | "video" | "audio";
};

type Leaf_Duration = {
  readonly type: "duration";
  readonly durationSeconds: number;
  readonly operand: ">" | "<";
};

type Leaf_HasGPS = {
  readonly type: "has_gps";
};

type Leaf_Path = {
  readonly type: "path";
  readonly path: string;
};

type Leaf_FileId = {
  readonly type: "file-id";
  readonly id: string;
};

type Leaf_FileRev = {
  readonly type: "file-rev";
  readonly rev: string;
};

export type Bool = Boolean_And | Boolean_Or | Boolean_Not;

type Boolean_And = {
  readonly type: "and";
  readonly left: FilterNode;
  readonly right: FilterNode;
};

type Boolean_Or = {
  readonly type: "or";
  readonly left: FilterNode;
  readonly right: FilterNode;
};

type Boolean_Not = {
  readonly type: "not";
  readonly left: FilterNode;
};
