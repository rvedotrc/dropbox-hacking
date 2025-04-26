import { getGlobalOptions } from "@blaahaj/dropbox-hacking-util";

const o = getGlobalOptions(["--debug-retry"]);

console.log({ o });
