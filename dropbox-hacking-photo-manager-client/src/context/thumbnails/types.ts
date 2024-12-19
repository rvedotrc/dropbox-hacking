export type ThumbnailLoader = {
  getThumbnail: (rev: string) => Promise<string | null>;
};
