import { Dropbox } from "dropbox";

export type DropboxProvider = () => Promise<Dropbox>;

export type Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => void
) => Promise<void>;

export type Operation = {
  verb: string;
  handler: Handler;
  argsHelp: string;
};

export type GlobalOptions = {
  debugUpload: boolean;
  debugSync: boolean;
  debugErrors: boolean;
};
