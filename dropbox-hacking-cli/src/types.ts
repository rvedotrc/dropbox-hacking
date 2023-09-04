import { Dropbox } from "dropbox";
import { GlobalOptions } from "dropbox-hacking-util";

export type DropboxProvider = () => Promise<Dropbox>;

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
