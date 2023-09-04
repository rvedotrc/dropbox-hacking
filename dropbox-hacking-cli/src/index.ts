import { getGlobalOptions } from "dropbox-hacking-util";

const o = getGlobalOptions(["--debug-retry"]);

console.log({ o });
