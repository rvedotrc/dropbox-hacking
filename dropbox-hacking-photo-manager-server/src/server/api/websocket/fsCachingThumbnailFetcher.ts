import type { files } from "dropbox";
import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import { dirname } from "path";

import type { Context } from "../../context.js";
import type { ThumbnailFetcher } from "./thumbnailFetcher.js";

const pathFor = async (
  rev: string,
  size: files.ThumbnailSize[".tag"],
  format: files.ThumbnailFormat[".tag"],
  mode: files.ThumbnailMode[".tag"],
): Promise<string> => {
  const hash = await crypto.subtle.digest({ name: "SHA-1" }, Buffer.from(rev));

  const slice = Buffer.from(hash.slice(0, 1)).toString("hex");

  return `./var/cache/thumbnails/${slice}/${rev}.${size}.${mode}.${format}`;
};

const trySave = async (content: string, filename: string): Promise<void> => {
  const tmpFile = `${filename}.tmp`;

  try {
    await writeFile(tmpFile, content, { encoding: "utf-8" });
    await rename(tmpFile, filename);
  } finally {
    try {
      await unlink(tmpFile);
    } catch {
      //
    }
  }
};

const backgroundSave = async (base64JPEG: string, filename: string) => {
  try {
    await trySave(base64JPEG, filename);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
    await mkdir(dirname(filename), { recursive: true });
    await trySave(base64JPEG, filename);
  }
};

export const fsCachingThumbnailFetcher =
  (_context: Context, _backend: ThumbnailFetcher): ThumbnailFetcher =>
  async (args) => {
    const filename = await pathFor(args.rev, args.size, "jpeg", "strict");

    try {
      const base64JPEG = await readFile(filename, { encoding: "utf-8" });
      console.debug(`Served ${args.rev} from FS cache ${filename}`);
      return { base64JPEG };
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }

    const answer = await _backend(args);

    if (answer !== null)
      backgroundSave(answer.base64JPEG, filename).then(
        () => console.debug(`Saved ${args.rev} to ${filename}`),
        (error) =>
          console.error(`Save of ${args.rev} thumbnail failed:`, error),
      );

    return answer;
  };
