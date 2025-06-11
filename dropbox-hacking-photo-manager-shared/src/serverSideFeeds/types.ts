export type RxFeedRequest =
  // legacy whole-database stuff
  | { readonly type: "rx-days" }
  | { readonly type: "rx-exif" }
  | { readonly type: "rx-photos" }
  | { readonly type: "rx-files" }

  // more focussed feeds
  | { readonly type: "ng.basic-counts" }
  | { readonly type: "ng.list-of-days"; withSamples: false }
  | { readonly type: "ng.file.id"; id: string }
  | { readonly type: "ng.file.rev"; rev: string }
  | { readonly type: "ng.content_hash"; contentHash: string }
  | { readonly type: "ng.day.files"; date: string };
// | { readonly type: "fsck" }
// | { readonly type: "years" }
// | { readonly type: "months"; readonly year: string }

// RVE-add-feed
