import { Dropbox, files } from "dropbox";

type PromiseEtc = {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
};

export default class ThumbnailResolver {
  private readonly promisesMade = new Map<string, Promise<string>>();
  private readonly queuedPaths = new Map<string, PromiseEtc>();
  private timer: NodeJS.Timer | undefined = undefined;

  constructor(
    public readonly dbx: Dropbox,
    public readonly maxDelayMillis: number,
    public readonly maxBatchSize = 25 // the maximum
  ) {}

  public getForPath(path: string): Promise<string> {
    const r = this.promisesMade.get(path);
    if (r) return r;

    const newPromise = new Promise<string>((resolve, reject) => {
      this.queuedPaths.set(path, { resolve, reject });
      this.timer =
        this.timer || setTimeout(() => this.sendRequest(), this.maxDelayMillis);
      if (this.queuedPaths.size >= this.maxBatchSize) this.sendRequest();
    });

    this.promisesMade.set(path, newPromise);
    return newPromise;
  }

  private sendRequest(): void {
    const toSend = new Map(this.queuedPaths);
    this.promisesMade.clear();
    this.queuedPaths.clear();
    this.timer = undefined;

    const request: files.GetThumbnailBatchArg = {
      entries: [...toSend.entries()].map(([k, _v]) => ({
        path: k,
        size: { ".tag": "w128h128" },
      })),
    };

    this.dbx.filesGetThumbnailBatch(request).then((result) => {
      for (const entry of result.result.entries) {
        if (entry[".tag"] === "success") {
          if (entry.metadata.path_lower) {
            const promiseEtc = toSend.get(entry.metadata.path_lower);
            if (promiseEtc) {
              promiseEtc.resolve(entry.thumbnail);
            }
          }
        }
      }

      for (const [_path, v] of toSend.entries()) {
        v.reject("Failed");
      }
    });
  }
}
