import type { ClosestToRequest, ThumbnailRequest } from "../index.js";

export type RxFeedRequest =
  // legacy whole-database stuff
  | { readonly type: "rx-days" }
  | { readonly type: "rx-exif" }
  | { readonly type: "rx-photos" }
  | { readonly type: "rx-files" }

  // more focussed feeds
  | { readonly type: "rx.ng.basic-counts" }
  | { readonly type: "rx.ng.fsck" }
  | { readonly type: "rx.ng.exif-explorer" }
  | { readonly type: "rx.ng.list-of-days"; readonly withSamples: false }
  | { readonly type: "rx.ng.file.id"; readonly id: string }
  | { readonly type: "rx.ng.file.rev"; readonly rev: string }
  | { readonly type: "rx.ng.content_hash"; readonly contentHash: string }
  | { readonly type: "rx.ng.day.files"; readonly date: string }
  | { readonly type: "rx.ng.closest-to"; readonly request: ClosestToRequest }
  | { readonly type: "rx.ng.thumbnail2"; readonly request: ThumbnailRequest };

// RVE-add-feed
