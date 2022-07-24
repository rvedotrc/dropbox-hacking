import { getDropboxClient } from "./auth";
import retrier from "./retry-and-rate-limit";
import { getGlobalOptions, GlobalOptionsSingleton } from "./globalOptions";
import { writeStderr } from "./util/logging";
import { Operation } from "./types";

export default (op: Operation): void => {
  const argv = process.argv.slice(2);

  const { globalOptions, remainingArgs } = getGlobalOptions(argv);
  GlobalOptionsSingleton.set(globalOptions);

  const getter = () =>
    getDropboxClient().then((dbx) => retrier(dbx, globalOptions));

  op.handler(getter, remainingArgs, globalOptions, async () => {
    const lines = typeof op.argsHelp === "string" ? [op.argsHelp] : op.argsHelp;
    const help = [
      "Usage:\n",
      ...lines.map((line) => `  ${op.verb} ${line}\n`),
    ].join("");
    return writeStderr(help).then(() => process.exit(2));
  }).catch((err) => {
    console.error({ err, stack: err.stack });
    process.exit(1);
  });
};
