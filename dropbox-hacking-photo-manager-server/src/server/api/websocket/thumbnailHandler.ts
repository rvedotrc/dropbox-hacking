import type { ThumbnailResponse } from "dropbox-hacking-photo-manager-shared";
import type { ThumbnailRequest } from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

import type { Context } from "../../context.js";

export const thumbnailHandlerBuilder = (context: Context) => {
  return (req: ThumbnailRequest): Promise<ThumbnailResponse> =>
    context
      .thumbnailFetcher(req)
      .then((r) => ({ thumbnail: r?.base64JPEG ?? null }));
};
