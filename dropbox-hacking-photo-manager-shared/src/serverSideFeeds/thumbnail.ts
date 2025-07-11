import { Observable } from "rxjs";

import { type FullDatabaseFeeds } from "./index.js";
import type { ThumbnailResponse } from "../ws.js";
import type { files } from "dropbox/types/dropbox_types.js";

export type ThumbnailRequest = {
  readonly type: "rx.ng.thumbnail2";
  readonly rev: string;
  readonly size: files.ThumbnailSize;
};

export const provideThumbnail =
  (handler: (req: ThumbnailRequest) => Promise<ThumbnailResponse>) =>
  (
    _feeds: FullDatabaseFeeds,
    req: ThumbnailRequest,
  ): Observable<ThumbnailResponse> =>
    new Observable<ThumbnailResponse>((subscriber) => {
      handler(req)
        .then((resp) => subscriber.next(resp))
        .catch((err) => subscriber.error(err));
    });
