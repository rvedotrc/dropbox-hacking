import * as child_process from "child_process";
import * as fs from "fs";

type YarnWorkspaceInfo = {
  location: string;
  workspaceDependencies: string[];
  mismatchedWorkspaceDependencies: string[]; // guess
};

type YarnWorkspacesInfo = Record<string, YarnWorkspaceInfo>;

type TSConfig = {
  references?: { path: string }[];
};

const readWorkspacesInfo = (): Promise<YarnWorkspacesInfo> =>
  new Promise((resolve, reject) => {
    const cp = child_process.spawn("yarn", ["--silent", "workspaces", "info"], {
      stdio: ["ignore", "pipe", "inherit"],
    });

    const out: Buffer[] = [];
    cp.stdout.on("data", (chunk) => out.push(Buffer.from(chunk)));
    cp.on("close", (code, signal) => {
      if (code === 0 && signal === null) {
        try {
          resolve(JSON.parse(Buffer.concat(out).toString()));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(err));
        }
      } else {
        reject(
          new Error(`Failed to read yarn workspaces (${code} / ${signal})`),
        );
      }
    });
  });

type DecoratedWorkspace = {
  name: string;
  info: YarnWorkspaceInfo;
  tsconfig: TSConfig;
  dependsOn: Set<string>;
  waiter: Awaited<ReturnType<typeof withResolvers<void>>>;
};

const decorateWorkspace = async (
  name: string,
  info: YarnWorkspaceInfo,
): Promise<DecoratedWorkspace> =>
  fs.promises
    .readFile(`${name}/tsconfig.json`, { encoding: "utf-8" })
    .then((str) => JSON.parse(str) as TSConfig)
    .then((tsconfig) => ({ name, info, tsconfig }))
    .then(async (partial) => ({
      ...partial,
      dependsOn: new Set([
        ...info.workspaceDependencies,
        ...(partial.tsconfig.references || []).map((dep) =>
          dep.path.replace("../", ""),
        ),
      ]),
      waiter: withResolvers(),
    }));

type DecoratedWorkspaceMap = Map<string, DecoratedWorkspace>;

const decorateWorkspaces = async (
  workspaces: YarnWorkspacesInfo,
): Promise<DecoratedWorkspaceMap> =>
  Promise.all(
    Object.entries(workspaces).map(([name, info]) =>
      decorateWorkspace(name, info),
    ),
  ).then((decorations) => {
    const map: DecoratedWorkspaceMap = new Map();
    for (const d of decorations) {
      map.set(d.name, d);
    }
    return map;
  });

const buildWorkspace = async (
  w: DecoratedWorkspace,
  dependenciesPromise: Promise<unknown>,
): Promise<void> => {
  const packageJson: { scripts: Record<string, string> } = JSON.parse(
    (await fs.promises.readFile(`./${w.name}/package.json`)).toString(),
  );

  const yarnRun = (key: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const shell = packageJson.scripts[key];
      if (typeof shell !== "string")
        throw `No yarn script for ${w.name} ${key}`;

      const cp = child_process.spawn("sh", ["-c", shell], {
        cwd: w.name,
        stdio: "pipe",
        env: {
          PATH: `node_modules/.bin:${process.env.PATH}`,
        },
      });
      cp.stdin.end();

      for (const stream of ["stdout", "stderr"] as const) {
        const s = cp[stream];
        s.on("data", (chunk) =>
          chunk
            .toString()
            .trim()
            .split("\n")
            .forEach((line) =>
              console.log(`${w.name} ${key} ${stream}: ${line}`),
            ),
        );
      }

      cp.on("close", (code, signal) => {
        if (code === 0 && signal === null) {
          return resolve(undefined);
        }

        reject(`${w.name} ${key} failed: ${code} / ${signal}`);
      });
    });

  await dependenciesPromise;
  await yarnRun("compile");
};

// Like Promise.withResolvers:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
const withResolvers = <T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: unknown) => void;
} => {
  let resolve: unknown = undefined;
  let reject: unknown = undefined;

  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });

  return {
    promise,
    resolve: resolve as (value: T | PromiseLike<T>) => void,
    reject: reject as (reason: unknown) => void,
  };
};

const main = async (): Promise<void> => {
  const infos = await readWorkspacesInfo();
  const decorated = await decorateWorkspaces(infos);

  for (const w of decorated.values()) {
    const allDependencies = Promise.all(
      [...w.dependsOn].map((depName) => decorated.get(depName)!.waiter.promise),
    ).then(() => undefined);

    buildWorkspace(w, allDependencies).then(w.waiter.resolve, w.waiter.reject);
  }

  await Promise.all([...decorated.values()].map((e) => e.waiter.promise));
};

main();
