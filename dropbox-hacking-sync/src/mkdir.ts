import * as fs from "fs";
import * as path from "path";

export type Mkdir = {
  seed: (localPath: string) => void;
  mkdir: (localPath: string) => Promise<void>;
};

export default (dryRun: boolean): Mkdir => {
  const mkdirPromiseMap: Map<string, Promise<void>> = new Map();

  const seed = (localPath: string): void => {
    mkdirPromiseMap.set(localPath, Promise.resolve());
  };

  const mkdir = (localPath: string): Promise<void> => {
    let promise = mkdirPromiseMap.get(localPath);
    if (promise) return promise;

    const parentPath = path.dirname(localPath);
    const parentPromise =
      parentPath !== localPath ? mkdir(parentPath) : Promise.resolve();

    promise = parentPromise.then(() => {
      console.log(`mkdir [${localPath}]`);
      if (!dryRun)
        return fs.promises.mkdir(localPath).catch((err) => {
          if (err.code === "EEXIST" || err.code === "EISDIR") return;
          throw err;
        });
      return;
    });

    mkdirPromiseMap.set(localPath, promise);

    return promise;
  };

  return { seed, mkdir };
};
