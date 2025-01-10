import uploadSession from "./upload-session.js";
import uploadSingle, { MAX_SINGLE_UPLOAD_SIZE } from "./upload-single.js";

const selectUploader = (size: number | undefined): typeof uploadSingle =>
  typeof size === "number" && size <= MAX_SINGLE_UPLOAD_SIZE
    ? uploadSingle
    : uploadSession;

export { MAX_SINGLE_UPLOAD_SIZE, selectUploader, uploadSession, uploadSingle };

export * from "./make-content-hash.js";
