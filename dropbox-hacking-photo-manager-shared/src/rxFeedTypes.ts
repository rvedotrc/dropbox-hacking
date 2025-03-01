export type RxFeedResponse<T> =
  | { tag: "next"; value: T }
  | { tag: "complete" }
  | { tag: "error"; error: unknown };
