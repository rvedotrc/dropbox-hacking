import type {
  ThumbnailRequest,
  ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";

import type { Socket } from "../websocket/socket";
import type { ThumbnailLoader } from "./types";

export const websocketThumbnailLoader = (ws: Socket): ThumbnailLoader => ({
  getThumbnail: (rev: string) =>
    ws
      .simpleRequest<ThumbnailRequest, ThumbnailResponse>({
        verb: "getThumbnail",
        rev,
        size: { ".tag": "w128h128" },
      })
      .then((r) => r.thumbnail),
});
