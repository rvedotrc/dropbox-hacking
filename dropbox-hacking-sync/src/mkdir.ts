import * as fs from "fs";
import * as path from "path";

export type Mkdir = {
  seed: (localPath: string) => void;
  mkdir: (localPath: string) => Promise<void>;
};

// A local-mkdir-p engine. A Mkdir object has two properties:
// - "seed", which can be used to tell the engine about local directories which already exist
// - "mkdir", which returns a promise to create the given directory (and its parents)

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
        return fs.promises.mkdir(localPath).catch((err: Error) => {
          if ("code" in err && (err.code === "EEXIST" || err.code === "EISDIR"))
            return;
          throw err;
        });
      return;
    });

    mkdirPromiseMap.set(localPath, promise);

    return promise;
  };

  return { seed, mkdir };
};
