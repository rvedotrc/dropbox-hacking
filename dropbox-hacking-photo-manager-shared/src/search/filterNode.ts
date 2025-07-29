export type FilterNode = Leaf | Bool;

export type Leaf =
  | Leaf_Tag
  | Leaf_TagCount
  | Leaf_Timestamp
  | Leaf_Text
  | Leaf_MediaType
  | Leaf_Duration
  | Leaf_HasGPS
  | Leaf_Path;

type Leaf_Tag = {
  readonly type: "tag";
  readonly tag: string;
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

export const parseFilterString = (query: string): FilterNode | null => {
  const parts = query.trim().split(" ");

  const stack: FilterNode[] = [];

  for (const part of parts) {
    let match: RegExpMatchArray | null = null;

    // combiners

    if (part === "!") {
      const left = stack.pop();
      if (!left) return null;

      stack.push({ type: "not", left });
      continue;
    }

    if (part === "&") {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) return null;

      stack.push({ type: "and", left, right });
      continue;
    }

    if (part === "|") {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) return null;

      stack.push({ type: "or", left, right });
      continue;
    }

    // leaf nodes

    // TODO: no way yet to generate "text" nodes containing spaces
    if (part.startsWith("text~")) {
      stack.push({ type: "text", text: part.substring(5) });
      continue;
    }

    if (part.startsWith("path~")) {
      stack.push({ type: "path", path: part.substring(5) });
      continue;
    }

    if (part.startsWith("tag=")) {
      stack.push({ type: "tag", tag: part.substring(4) });
      continue;
    }

    if ((match = part.match(/^tags([<>])(\d+)$/))) {
      stack.push({
        type: "tag_count",
        operand: match[1] as never,
        tagCount: Number(match[2]),
      });
      continue;
    }

    if ((match = part.match(/^date([<>])(\S+)$/))) {
      stack.push({
        type: "timestamp",
        operand: match[1] as never,
        timestamp: match[2],
      });
      continue;
    }

    if ((match = part.match(/^duration([<>])(\d+(?:\.\d+)?)$/))) {
      stack.push({
        type: "duration",
        operand: match[1] as never,
        durationSeconds: Number(match[2]),
      });
      continue;
    }

    if (part === "gps") {
      stack.push({
        type: "has_gps",
      });
      continue;
    }

    if (["image", "audio", "video"].includes(part)) {
      stack.push({ type: "media_type", mediaType: part as never });
      continue;
    }
  }

  console.debug({ parts, stack });

  const answer = stack.pop();
  if (stack.length !== 0) return null;
  return answer ?? null;
};
