import * as fs from "fs";
import * as path from "path";

type Item = {
  path: string;
  stat: fs.Stats;
};

export default (
  localPath: string,
  recursive: boolean
): Promise<Item[] | "not_found"> => {
  const items: Item[] = [];

  const walk = (
    thisLocalPath: string,
    catchNotFound: boolean
  ): Promise<undefined | "not_found"> =>
    fs.promises.lstat(thisLocalPath).then(
      (stat) => {
        if (stat.isFile()) {
          items.push({
            path: thisLocalPath,
            stat,
          });
          return Promise.resolve(undefined);
        } else if (stat.isDirectory()) {
          const canonPath = path.join(thisLocalPath, ".");
          items.push({ path: canonPath, stat });

          if (!recursive) return Promise.resolve(undefined);

          return fs.promises
            .readdir(thisLocalPath)
            .then((entries) =>
              Promise.all(
                entries.map((entry) => {
                  if (entry === "." || entry === "..") {
                    return Promise.resolve();
                  } else {
                    return walk(path.join(canonPath, entry), false);
                  }
                })
              )
            )
            .then(() => undefined);
        } else {
          return Promise.resolve(undefined);
        }
      },
      (err) => {
        if (catchNotFound && err.code === "ENOENT") return "not_found";
        throw err;
      }
    );

  return walk(localPath, true).then((maybeNotFound) => maybeNotFound || items);
};
