import * as fs from "fs";
import * as path from "path";

export type Item = {
  path: string;
  relativeKey: string;
  stat: fs.Stats;
  tag: "file" | "directory" | "other";
};

export type FileItem = Item & { tag: "file" };
export type DirectoryItem = Item & { tag: "directory" };

export default (localPath: string, recursive: boolean): Promise<Item[]> => {
  const items: Item[] = [];

  const walk = (
    thisLocalPath: string,
    relativeKey: string,
    catchNotFound: boolean
  ): Promise<void> =>
    fs.promises.lstat(thisLocalPath).then(
      (stat) => {
        if (stat.isDirectory()) {
          const canonPath = path.join(thisLocalPath, ".");
          items.push({ path: canonPath, relativeKey, stat, tag: "directory" });

          if (!recursive) return Promise.resolve();

          return fs.promises
            .readdir(thisLocalPath)
            .then((entries) =>
              Promise.all(
                entries.map((entry) => {
                  if (entry === "." || entry === "..") {
                    return Promise.resolve();
                  } else {
                    return walk(
                      path.join(canonPath, entry),
                      `${relativeKey}/${entry}`,
                      false
                    );
                  }
                })
              )
            )
            .then(() => undefined);
        } else {
          items.push({
            path: thisLocalPath,
            relativeKey,
            stat,
            tag: stat.isFile() ? "file" : "other",
          });
          return;
        }
      },
      (err) => {
        if (catchNotFound && err.code === "ENOENT") return;
        throw err;
      }
    );

  return walk(localPath, "", true).then(() => items);
};
