import * as child_process from "node:child_process";
import * as fs from "node:fs";

const main = async () => {
  const dirs = (await fs.promises.readdir(".")).filter((name) =>
    name.startsWith("dropbox-hacking-")
  );

  const namesWithLinks = await Promise.all(
    dirs.map((dir) =>
      fs.promises
        .readFile(`${dir}/package.json`)
        .then((text) => JSON.parse(text))
        .then((packageJson) =>
          Object.entries(packageJson.dependencies ?? {}).flatMap(
            ([name, spec]) => (spec.startsWith("link:") ? [name] : [])
          )
        )
        .then((dependsOn) => ({
          module: dir,
          dependsOn,
          promiseWithResolvers: Promise.withResolvers(),
        }))
    )
  );

  const promisesMap = {};
  for (const item of namesWithLinks) {
    promisesMap[item.module] = item.promiseWithResolvers.promise;
  }

  for (const item of namesWithLinks) {
    Promise.resolve()
      .then(() => console.log(`${item.module} promise starting`))
      .then(() => {
        if (item.dependsOn.length > 0) {
          console.log(
            `${item.module} waiting for ${item.dependsOn.join(", ")}`
          );
          return Promise.all(
            item.dependsOn.map((dep) => promisesMap[dep])
          ).then(() => console.log(`${item.module} dependencies are ready`));
        }
      })
      .then(() => {
        console.log(`${item.module} running build`);
        const child = child_process.spawn("pnpm", ["build"], {
          cwd: item.module,
          stdio: ["ignore", "pipe", "pipe"],
        });

        child.on("close", (code, signal) => {
          if (signal) {
            const msg = `${item.module} was killed with ${signal}`;
            console.error(msg);
            item.promiseWithResolvers.reject(new Error(msg));
          } else if (code) {
            const msg = `${item.module} failed with ${code}`;
            console.error(msg);
            item.promiseWithResolvers.reject(new Error(msg));
          } else {
            console.log(`${item.module} build succeeded`);
            item.promiseWithResolvers.resolve();
          }
        });

        child.stdout.on("data", (content) =>
          Buffer.from(content)
            .toString("utf-8")
            .trimEnd()
            .split("\n")
            .forEach((line) => console.log(`${item.module} out: ${line}`))
        );
        child.stderr.on("data", (content) =>
          Buffer.from(content)
            .toString("utf-8")
            .trimEnd()
            .split("\n")
            .forEach((line) => console.log(`${item.module} err: ${line}`))
        );
      })
      .then(
        () => console.log(`${item.module} succeeded`),
        (error) => {
          console.error(`${item.module} failed:`, error);
          throw error;
        }
      );
  }

  const outcomes = await Promise.allSettled(
    namesWithLinks.map((item) => item.promiseWithResolvers.promise)
  );

  if (outcomes.some((st) => st.status === "rejected"))
    throw new Error("Not all builds succeeded");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
