import {} from "dropbox-hacking-photo-manager-shared";

import type { ThumbnailLoader } from "./types";

export class DiscardingThumbnailLoader implements ThumbnailLoader {
  constructor(
    private readonly backend: ThumbnailLoader,
    private readonly discardAfter: number,
  ) {}

  private readonly byRev = new Map<
    string,
    { timeout: NodeJS.Timeout; promise: Promise<string | null> }
  >();

  public getThumbnail(rev: string): Promise<string | null> {
    const r = this.byRev.get(rev);
    if (r) {
      clearTimeout(r.timeout);
      r.timeout = setTimeout(() => {
        this.byRev.delete(rev);
      }, this.discardAfter);
      return r.promise;
    } else {
      const promise = this.backend.getThumbnail(rev);
      this.byRev.set(rev, {
        promise,
        timeout: setTimeout(() => {
          this.byRev.delete(rev);
        }, this.discardAfter),
      });
      return promise;
    }
  }
}

export const discardingThumbnailLoader = (
  backend: ThumbnailLoader,
  discardAfter: number,
): ThumbnailLoader => new DiscardingThumbnailLoader(backend, discardAfter);
