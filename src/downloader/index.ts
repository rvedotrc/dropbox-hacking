import { Dropbox, files } from "dropbox";

export default (
  _dbx: Dropbox,
  local: string,
  remote: files.FileMetadata
): Promise<void> => Promise.reject(`TODO download to ${local} from ${remote}`);
