import { Dropbox } from "dropbox";

export type DropboxProvider = () => Promise<Dropbox>;

export type Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  usageFail: () => void
) => Promise<void>;

export type Operation = {
  verb: string;
  handler: Handler;
  argsHelp: string;
};
