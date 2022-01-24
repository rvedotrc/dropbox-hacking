import { StateDir } from "./components/lsCache";
import { parseTime } from "./util/time";
import { ExifDB } from "./components/exif/exifDB";

const getTimeFromFilename = (name: string): Date | undefined => {
  const m = name.match(/^(\d\d\d\d-\d\d-\d\d) (\d\d).(\d\d)\.(\d\d)\.jpg$/);
  if (!m) return undefined;

  const s = `${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`;
  try {
    return new Date(s);
  } catch {
    return undefined;
  }
};

const main = async (): Promise<void> => {
  const stateDir = new StateDir(process.argv[2]);
  await stateDir.load();
  const state = await stateDir.getState();

  const exifDB = new ExifDB("var/exifdb");
  const allExif = await exifDB.readAll();

  if (state.tag === "ready") {
    for (const entry of state.entries.values()) {
      if (entry[".tag"] !== "file") continue;
      if (!entry.path_lower?.endsWith(".jpg")) continue;
      if (!entry.path_lower?.startsWith("/pics/")) continue;

      // Time sources:
      // client_modified
      // server_modified (maybe)
      // name
      // the directory it's in
      // maybe EXIF (requires content)

      const exif =
        entry.content_hash === undefined
          ? undefined
          : allExif.get(entry.content_hash);
      const exifDateNum = exif?.exifData?.tags?.CreateDate;
      const exifTime = exifDateNum ? new Date(exifDateNum * 1000) : null;

      // If client_modified matches the basename,
      // then everything's probably fine.

      const clientModified = parseTime(entry.client_modified);
      const filenameTime = getTimeFromFilename(entry.name);
      let filenameToMtimeOffset: number | undefined = undefined;

      if (filenameTime) {
        filenameToMtimeOffset =
          clientModified.getTime() - filenameTime.getTime();

        // if (offset === 0 || offset === 3600000 || offset === 7200000) {
        //   continue;
        // }
      }

      let exifToMtimeOffset: number | undefined = undefined;
      if (exifTime !== null) {
        exifToMtimeOffset = clientModified.getTime() - exifTime.getTime();
      }

      console.log(
        JSON.stringify({
          entry,
          clientModified,
          filenameTime: filenameTime || null,
          filenameToMtimeOffset: filenameToMtimeOffset || null,
          exifTime: exifTime || null,
          exifToMtimeOffset: exifToMtimeOffset || null,
          exifToFilenameOffset:
            exifTime && filenameTime
              ? clientModified.getTime() - exifTime.getTime()
              : null,
        })
      );
    }
  }
};

main().catch((err) => {
  console.error(err);
  throw err;
});
