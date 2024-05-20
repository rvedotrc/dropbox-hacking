import * as child_process from "child_process";
import * as fs from "fs";

type YarnWorkspaceInfo = {
    location: string;
    workspaceDependencies: string[];
    mismatchedWorkspaceDependencies: string[]; // guess
}

type YarnWorkspacesInfo = Record<string, YarnWorkspaceInfo>

type TSConfig = {
    references?: { path: string }[]
}

const readWorkspacesInfo = (): Promise<YarnWorkspacesInfo> =>
    new Promise((resolve, reject) => {
        const cp = child_process.spawn(
            "yarn", ["--silent", "workspaces", "info"],
            { stdio: ['ignore', 'pipe', 'inherit'] }
        );

        const out: Buffer[] = [];
        cp.stdout.on("data", chunk => out.push(Buffer.from(chunk)));
        cp.on("close", (code, signal) => {
            if (code === 0 && signal === null) {
                try {
                    resolve(JSON.parse(Buffer.concat(out).toString()));
                } catch (err) {
                    reject(err instanceof Error ? err : new Error(err));
                }
            } else {
                reject(new Error(`Failed to read yarn workspaces (${code} / ${signal})`));
            }
        });
    });

type DecoratedWorkspace = {
    name: string;
    info: YarnWorkspaceInfo;
    tsconfig: TSConfig;
    dependsOn: Set<string>;
}

const decorateWorkspace = async (name: string, info: YarnWorkspaceInfo): Promise<DecoratedWorkspace> =>
    fs.promises.readFile(`${name}/tsconfig.json`, { encoding: "utf-8" })
        .then(str => JSON.parse(str) as TSConfig)
        .then(tsconfig => ({ name, info, tsconfig }))
        .then(partial => ({
            ...partial,
            dependsOn: new Set([
                ...info.workspaceDependencies,
                ...(partial.tsconfig.references || []).map(
                    dep => dep.path.replace("../", "")
                )
            ])
        }));

type DecoratedWorkspaceMap = Map<string, DecoratedWorkspace>

const decorateWorkspaces = async (workspaces: YarnWorkspacesInfo): Promise<DecoratedWorkspaceMap> =>
    Promise.all(
        Object.entries(workspaces)
            .map(([name, info]) => decorateWorkspace(name, info))
    ).then(decorations => {
        const map: DecoratedWorkspaceMap = new Map();
        for (const d of decorations) {
            map.set(d.name, d);
        }
        return map;
    })

const inDependencyOrder = (workspaces: DecoratedWorkspaceMap): string[] => {
    const satisfied: string[] = [];

    while (satisfied.length < workspaces.size) {
        const canSatisfy = [...workspaces.values()]
            .filter(w => !satisfied.includes(w.name))
            .filter(w =>
                (w.info.workspaceDependencies || []).every(dep => satisfied.includes(dep))
                && [...w.dependsOn].every(dep => satisfied.includes(dep))
            );

        if (canSatisfy.length === 0)
            throw new Error("Cannot resolve dependency order");

        for (const w of canSatisfy) {
            satisfied.push(w.name);
        }
    }

    return satisfied;
};

const buildWorkspace = async (w: DecoratedWorkspace, promiseMap: Map<string, Promise<void>>): Promise<void> => {
    console.log(`Build ${w.name}`);

    const packageJson: { scripts: Record<string, string> } =
        JSON.parse((await fs.promises.readFile(`./${w.name}/package.json`)).toString());

    const yarnRun = (key: string): Promise<void> =>
        new Promise((resolve, reject) => {
            const shell = packageJson.scripts[key];
            if (typeof shell !== "string") throw `No yarn script for ${w.name} ${key}`;

            console.log(`Build ${w.name} ${key}`);

            const cp = child_process.spawn(
                "sh", ["-c", shell],
                {
                    cwd: w.name,
                    stdio: 'pipe',
                    env: {
                        PATH: `node_modules/.bin:${process.env.PATH}`
                    }
                }
            );
            cp.stdin.end();

            for (const stream of ["stdout", "stderr"] as const) {
                const s = cp[stream];
                s.on('data', chunk => chunk.toString().trim().split("\n")
                    .forEach(line => console.log(`${w.name} ${key} ${stream}: ${line}`)));
                // s.on('close', () => console.log(`${w.name} ${key} ${stream} closed`));
            }

            cp.on('close', (code, signal) => {
                if (code === 0 && signal === null) {
                    // console.log(`${w.name} ${key} completed OK`);
                    return resolve(undefined);
                }

                reject(`${w.name} ${key} failed: ${code} / ${signal}`);
            });
        });

    await yarnRun("prettier");
    await yarnRun("lint");
    await Promise.all([...w.dependsOn].map(dep => promiseMap.get(dep)));
    await yarnRun("compile");
};

const main = async (): Promise<void> => {
    const infos = await readWorkspacesInfo();
    const decorated = await decorateWorkspaces(infos);
    const _inDepOrder = inDependencyOrder(decorated);
    const mapOfPromises = new Map<string, Promise<void>>();

    for (const w of decorated.values()) {
        mapOfPromises.set(w.name, buildWorkspace(w, mapOfPromises));
    }

    await Promise.all([...mapOfPromises.values()]);
}

main();
