import { Dropbox } from "dropbox";

export type DropboxProvider = () => Dropbox;
export type Operation = {
  verb: string;
  handler: (dbxp: DropboxProvider, argv: string[]) => void;
  argsHelp: string;
};
