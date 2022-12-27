import { Dropbox } from "dropbox";

export type DropboxProvider = () => Promise<Dropbox>;

export type Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>
) => Promise<void>;

export type Operation = {
  verb: string;
  handler: Handler;
  argsHelp: string | string[];
};

export type GlobalOptions = {
  debugUpload: boolean;
  debugSync: boolean;
  debugErrors: boolean;
  debugPoll: boolean;
  debugLimiter: boolean;
  debugLister: boolean;
};
