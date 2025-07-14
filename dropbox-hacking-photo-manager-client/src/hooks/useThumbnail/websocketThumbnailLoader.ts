import { getRxFeed } from "@lib/rxFeed/getRxFeed";
import type {
  IOHandler,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";
import type { RxFeedRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

import type { ThumbnailLoader } from "./types";

export const websocketThumbnailLoader = (
  mx: IOHandler<unknown, unknown> | undefined,
): ThumbnailLoader => ({
  getThumbnail: (rev: string) =>
    new Promise<string | null>((resolve, reject) => {
      if (!mx) return resolve(null);

      const subscription = getRxFeed<ThumbnailResponse, RxFeedRequest>(
        {
          type: "rx.ng.thumbnail2",
          rev,
          size: { [".tag"]: "w128h128" },
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
