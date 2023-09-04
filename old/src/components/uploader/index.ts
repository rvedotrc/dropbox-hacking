import uploadSingle, { MAX_SINGLE_UPLOAD_SIZE } from "./upload-single";
import uploadSession from "./upload-session";

const selectUploader = (size: number | undefined): typeof uploadSingle =>
  typeof size === "number" && size <= MAX_SINGLE_UPLOAD_SIZE
    ? uploadSingle
    : uploadSession;

export { MAX_SINGLE_UPLOAD_SIZE, uploadSingle, uploadSession, selectUploader };
