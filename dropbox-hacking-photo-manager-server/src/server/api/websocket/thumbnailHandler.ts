import type {
  ThumbnailRequest,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared/serverSideFeeds";

import type { Context } from "../../context.js";

export const thumbnailHandlerBuilder = (context: Context) => {
  return (req: ThumbnailRequest): Promise<ThumbnailResponse> =>
    context
      .thumbnailFetcher(req)
      .then((r) => ({ thumbnail: r?.base64JPEG ?? null }));
};
