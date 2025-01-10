import * as fs from "fs";
import * as path from "path";

export type Item = {
  relativePath: string;
  path: string;
  stat: fs.Stats;
  tag: "file" | "directory" | "other";
};

export type FileItem = Item & { tag: "file" };
export type DirectoryItem = Item & { tag: "directory" };

export default (localPath: string, recursive: boolean): Promise<Item[]> => {
  const items: Item[] = [];

  const walk = (
    thisLocalPath: string,
    relativePath: string,
    catchNotFound: boolean,
  ): Promise<void> =>
    fs.promises.lstat(thisLocalPath).then(
      (stat) => {
        if (stat.isDirectory()) {
          const canonPath = path.join(thisLocalPath, ".");
          items.push({ path: canonPath, relativePath, stat, tag: "directory" });

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
                      `${relativePath}/${entry}`,
                      false,
                    );
                  }
                }),
              ),
            )
            .then(() => undefined);
        } else {
          items.push({
            path: thisLocalPath,
            relativePath,
            stat,
            tag: stat.isFile() ? "file" : "other",
          });
          return;
        }
      },
      (err: Error) => {
        if (catchNotFound && "code" in err && err.code === "ENOENT") return;
        throw err;
      },
    );

  return walk(localPath, "", true).then(() => items);
};
