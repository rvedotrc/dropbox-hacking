import { Dropbox, files } from "dropbox";
import { GlobalOptions } from "@blaahaj/dropbox-hacking-util";

type Entry = {
  job: files.RelocationPath;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export class Mover {
  private readonly dbx: Dropbox;
  // private readonly globalOptions: GlobalOptions;
  private readonly maxBatchSize = 100;
  private readonly maxDelay = 1000;
  private readonly entries: Entry[] = [];
  private timer: NodeJS.Timeout | undefined = undefined;

  constructor(dbx: Dropbox, _globalOptions: GlobalOptions) {
    this.dbx = dbx;
    // this.globalOptions = globalOptions;
  }

  public submit(job: files.RelocationPath): Promise<void> {
    return new Promise((resolve, reject) => {
      this.entries.push({
        job,
        resolve,
        reject,
      });

      if (!this.timer)
        this.timer = setTimeout(() => this.flush(), this.maxDelay);
      if (this.entries.length >= this.maxBatchSize) this.flush();
    });
  }

  private flush() {
    if (this.entries.length === 0) return;

    const copy = [...this.entries];
    this.entries.length = 0;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;

    const dbx = this.dbx;

    const complete = (
      entries: files.RelocationBatchResultEntry[],
    ): Promise<void> => {
      entries.forEach((entry, index) => {
        const job = copy[index];
        // console.log({ entry, index, job });
        if (entry[".tag"] === "success") {
          job.resolve();
        } else if (
          entry[".tag"] === "failure" &&
          entry.failure[".tag"] === "too_many_write_operations"
        ) {
          console.debug(
            `${JSON.stringify(job.job)} got rate limited, resubmitting`,
          );
          setTimeout(() => job.resolve(this.submit(job.job)), 3000);
        } else {
          job.reject(JSON.stringify(entry));
        }
      });

      return Promise.resolve();
    };

    const poll = (asyncJobId: string): Promise<void> =>
      dbx
        .filesMoveBatchCheckV2({ async_job_id: asyncJobId })
        .then((r) => r.result)
        .then((status) =>
          status[".tag"] === "in_progress"
            ? new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
                poll(asyncJobId),
              )
            : complete(status.entries),
        );

    dbx
      .filesMoveBatchV2({
        entries: copy.map((e) => e.job),
      })
      .then((r) => r.result)
      .then((result) =>
        result[".tag"] === "async_job_id"
          ? poll(result.async_job_id)
          : complete(result.entries),
      )
      .catch((err) => copy.forEach((e) => e.reject(err)));
  }
}
