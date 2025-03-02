import { DayMetadata } from "dropbox-hacking-photo-manager-shared";
import * as fs from "fs";

export default class DayDb {
  constructor(public dir: string) {}

  public days(): Promise<DayMetadata[]> {
    return fs.promises.readFile(this.dayDbFile(), { encoding: "utf-8" }).then(
      (text) => JSON.parse(text) as DayMetadata[],
      (err: Error & { code: string }) => {
        if (err.code === "ENOENT") return [];

        throw err;
      },
    );
  }

  public setDay(newMetadata: DayMetadata): Promise<void> {
    return this.days().then((days) => {
      const newDays = days.filter((day) => day.date !== newMetadata.date);
      newDays.push(newMetadata);
      newDays.sort((a, b) => a.date.localeCompare(b.date));
      const content = JSON.stringify(newDays) + "\n";
      return this.saveFile({ path: this.dayDbFile(), content });
    });
  }

  private dayDbFile(): string {
    return `${this.dir}/days.json`;
  }

  private saveFile(args: { path: string; content: string }): Promise<void> {
    const tmpFile = `${args.path}.${new Date().getTime()}.tmp`;

    return fs.promises
      .writeFile(tmpFile, args.content, { encoding: "utf-8", mode: 0o644 })
      .then(() => fs.promises.rename(tmpFile, args.path))
      .finally(() => void fs.promises.unlink(tmpFile).catch(() => null));
  }
}
