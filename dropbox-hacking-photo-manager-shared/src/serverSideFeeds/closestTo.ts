import { Observable } from "rxjs";

import type { GPSLatNLongE } from "../gpsLatLong.js";
import type { ClosestToResponse } from "../ws.js";
import { type FullDatabaseFeeds } from "./index.js";

export type ClosestToRequest = {
  readonly type: "rx.ng.closest-to";

  readonly from: GPSLatNLongE;
  readonly nClosest: number;
  readonly maxDistanceInMeters: number;
};

export const provideClosestTo =
  (handler: (req: ClosestToRequest) => Promise<ClosestToResponse>) =>
  (
    _feeds: FullDatabaseFeeds,
    req: ClosestToRequest,
  ): Observable<ClosestToResponse> =>
    new Observable<ClosestToResponse>((subscriber) => {
      handler(req)
        .then((resp) => subscriber.next(resp))
        .catch((err) => subscriber.error(err));
    });
