import type {
  ThumbnailRequest,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context.js";
import { fsCachingThumbnailFetcher } from "./fsCachingThumbnailFetcher.js";
import { batchingThumbnailFetcher } from "./thumbnailFetcher.js";

export const thumbnailHandlerBuilder = (context: Context) => {
  const fetcher = fsCachingThumbnailFetcher(
    context,
    batchingThumbnailFetcher(context),
  );

  return (req: ThumbnailRequest): Promise<ThumbnailResponse> =>
    fetcher(req).then((r) => ({ thumbnail: r?.base64JPEG ?? null }));
};
