export const filenameExtensionIn =
  (allowedExtensions: readonly string[]) =>
  (path: string): boolean =>
    allowedExtensions.includes(
      path.split(".").pop()?.toLocaleLowerCase() ?? "",
    );

// https://en.wikipedia.org/wiki/Exif
export const exifableFileExtensions = [
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "wav",
  "png",
  "webp",
] as const;

export const isExifableFilename = filenameExtensionIn(exifableFileExtensions);

// https://mediaarea.net/en/MediaInfo/Support/Formats
export const mediainfoFileExtensions = [
  "ac3",
  "aifc",
  "aiff",
  "ape",
  "asf",
  "au",
  "avi",
  "avr",
  "dat",
  "dts",
  "flac",
  "iff",
  "ifo",
  "irca",
  "m1v",
  "m2v",
  "mac",
  "mat",
  "mka",
  "mks",
  "mkv",
  "mov",
  "mp2",
  "mp3",
  "mp4",
  "mpeg",
  "mpg",
  "mpgv",
  "mpv",
  "ogg",
  "ogm",
  "paf",
  "pvf",
  "qt",
  "ra",
  "rm",
  "rmvb",
  "sd2",
  "sds",
  "vob",
  "w64",
  "wav",
  "wma",
  "wmv",
  "xi",
  "aac",
] as const;

export const isMediainfoableFilename = filenameExtensionIn(
  mediainfoFileExtensions,
);

export const dropboxThumbnailableExtensions = [
  "jpg",
  "jpeg,",
  "png",
  "tiff",
  "tif",
  "gif",
  "webp",
  "ppm",
  "bmp",

  // And observationally also:
  "cr3",
  "mov",
  "mp4",
] as const;

export const isPreviewable = filenameExtensionIn(
  dropboxThumbnailableExtensions,
);
