import type {
  ThumbnailRequest,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Context } from "../../context";
import { fsCachingThumbnailFetcher } from "./fsCachingThumbnailFetcher";
import { batchingThumbnailFetcher } from "./thumbnailFetcher";

export const thumbnailHandler = (context: Context) => {
  const fetcher = fsCachingThumbnailFetcher(
    context,
    batchingThumbnailFetcher(context),
  );

  return (req: ThumbnailRequest): Promise<ThumbnailResponse> =>
    fetcher(req).then((r) => ({ thumbnail: r?.base64JPEG ?? null }));
};
