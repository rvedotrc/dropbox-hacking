import { Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { ThumbnailRequest, ThumbnailResponse } from "../ws.js";

export const provideThumbnail = (
  _feeds: FullDatabaseFeeds,
  req: ThumbnailRequest,
  handler: (req: ThumbnailRequest) => Promise<ThumbnailResponse>,
): Observable<ThumbnailResponse> =>
  new Observable<ThumbnailResponse>((subscriber) => {
    handler(req)
      .then((resp) => subscriber.next(resp))
      .catch((err) => subscriber.error(err));
  });
