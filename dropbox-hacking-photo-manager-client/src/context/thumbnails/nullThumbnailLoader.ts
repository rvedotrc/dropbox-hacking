import type { ThumbnailLoader } from "./types";

export const nullLoader: ThumbnailLoader = {
  getThumbnail: () => Promise.resolve(null),
};
