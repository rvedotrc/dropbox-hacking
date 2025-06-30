import { Observable } from "rxjs";

export * from "./types.js";

import { type FullDatabaseFeeds } from "./index.js";
import type { ClosestToRequest, ClosestToResponse } from "../ws.js";

export const provideClosestTo = (
  _feeds: FullDatabaseFeeds,
  req: ClosestToRequest,
  handler: (req: ClosestToRequest) => Promise<ClosestToResponse>,
): Observable<ClosestToResponse> =>
  new Observable<ClosestToResponse>((subscriber) => {
    handler(req)
      .then((resp) => subscriber.next(resp))
      .catch((err) => subscriber.error(err));
  });
