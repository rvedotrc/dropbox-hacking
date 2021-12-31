import * as path from "path";
import * as fs from "fs";

export const makeMap = (): Map<string, Promise<void>> => new Map();

export const seed = (
  localPath: string,
  mkdirPromiseMap: Map<string, Promise<void>>
): void => {
  mkdirPromiseMap.set(localPath, Promise.resolve());
};

export const mkdir = (
  localPath: string,
  dryRun: boolean,
  mkdirPromiseMap: Map<string, Promise<void>>
): Promise<void> => {
  let promise = mkdirPromiseMap.get(localPath);
  if (promise) return promise;

  const parentPath = path.dirname(localPath);
  const parentPromise =
    parentPath !== localPath
      ? mkdir(parentPath, dryRun, mkdirPromiseMap)
      : Promise.resolve();

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
