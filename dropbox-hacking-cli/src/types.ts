import { DropboxProvider, GlobalOptions } from "dropbox-hacking-util";

export type Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
) => Promise<void>;

export type Operation = {
  verb: string;
  handler: Handler;
  argsHelp: string | string[];
};
