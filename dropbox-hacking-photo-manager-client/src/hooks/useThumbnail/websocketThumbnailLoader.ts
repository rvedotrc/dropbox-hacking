import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type {
  IOHandler,
  RxFeedResponse,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";
import type { ThumbnailRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

import type { ThumbnailLoader } from "./types";

export const websocketThumbnailLoader = (
  mx:
    | IOHandler<RxFeedResponse<ThumbnailResponse>, ThumbnailRequest>
    | undefined,
): ThumbnailLoader => ({
  getThumbnail: (rev: string) =>
    new Promise<string | null>((resolve, reject) => {
      if (!mx) return resolve(null);

      const subscription = getRxFeed(
        {
          type: "rx.ng.thumbnail2",
          rev,
          size: { ".tag": "w128h128" },
        },
        mx,
      ).subscribe({
        next: (v) => {
          resolve(v.thumbnail);
          subscription.unsubscribe();
        },
        error: (e) => reject(e instanceof Error ? e : new Error(e)),
      });
    }),
});
