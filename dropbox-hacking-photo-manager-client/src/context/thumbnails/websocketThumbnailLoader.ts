import type {
  IOHandler,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { ThumbnailLoader } from "./types";
import { getRxFeed } from "../../context/rx/getRxFeed";
import type { RxFeedRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

export const websocketThumbnailLoader = (
  mx: IOHandler<unknown, unknown> | undefined,
): ThumbnailLoader => ({
  getThumbnail: (rev: string) =>
    new Promise<string | null>((resolve, reject) => {
      if (!mx) return resolve(null);

      getRxFeed<ThumbnailResponse, RxFeedRequest>(
        {
          type: "rx.ng.thumbnail2",
          request: {
            verb: "getThumbnail",
            rev,
            size: { [".tag"]: "w128h128" },
          },
        },
        mx,
      ).subscribe({
        next: (v) => resolve(v.thumbnail),
        error: (e) => reject(e instanceof Error ? e : new Error(e)),
      });
    }),
});
