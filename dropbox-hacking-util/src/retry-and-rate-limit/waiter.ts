import { GlobalOptions } from "../global-options/index.js";

export default class Waiter {
  private readonly globalOptions: GlobalOptions;

  private state:
    | undefined
    | {
        queue: (() => void)[];
        until: number;
        timer: NodeJS.Timeout;
      } = undefined;

  constructor(globalOptions: GlobalOptions) {
    this.globalOptions = globalOptions;
  }

  public sleep(millis: number): void {
    this.debug(`RateLimitWaiter - sleep ${millis}`);
    const newUntil = new Date().getTime() + millis;
    if (this.state && this.state.until > newUntil) return;

    if (this.state && this.state.timer) clearTimeout(this.state.timer);

    this.state = {
      queue: this.state?.queue || [],
      until: newUntil,
      timer: setTimeout(() => this.wakeUp(), millis),
    };
  }

  public wait(message: string): Promise<void> {
    const t = this; // eslint-disable-line @typescript-eslint/no-this-alias

    return new Promise((resolve) => {
      if (!t.state) {
        this.debug(`${message} RateLimitWaiter - no wait`);
        return resolve();
      }

      this.debug(`${message} RateLimitWaiter - enqueueing`);
      t.state.queue.push(() => {
        this.debug(`${message} RateLimitWaiter - woke up`);
        resolve();
      });
    });
  }

  private wakeUp() {
    this.state?.queue.forEach((f) => process.nextTick(f));
    this.state = undefined;
  }

  private debug(...args: unknown[]) {
    if (this.globalOptions.debugErrors) console.debug(...args);
  }
}
