export type RxFeedRequest =
  // legacy whole-database stuff
  | { readonly type: "rx-days" }
  | { readonly type: "rx-exif" }
  | { readonly type: "rx-photos" }
  | { readonly type: "rx-files" }

  // more focussed feeds
  | { readonly type: "ng.basic-counts" }
  | { readonly type: "ng.list-of-days"; withSamples: false };
  // | { readonly type: "fsck" }
  // | { readonly type: "years" }
  // | { readonly type: "months"; readonly year: string }
