export type RxFeedResponse<T> =
  | { readonly tag: "next"; readonly value: T }
  | { readonly tag: "complete" }
  | { readonly tag: "error"; readonly error: unknown };
