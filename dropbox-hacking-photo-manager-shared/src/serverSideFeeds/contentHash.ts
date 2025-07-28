import { map, type Observable } from "rxjs";

import { type ContentHashCollection, type FullDatabaseFeeds } from "./index.js";

export type ContentHashRequest = {
  readonly type: "rx.ng.content_hash";
  readonly contentHash: string;
};

export type ContentHashResult = ContentHashCollection | null;

export const provideContentHash = (
  feeds: FullDatabaseFeeds,
  req: ContentHashRequest,
): Observable<ContentHashCollection | undefined> =>
  feeds.byContentHash.pipe(map((m) => m.get(req.contentHash)));
