import { StateDir } from "./operations/lsCache";
import { parseTime } from "./util";

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

  if (state.tag === "ready") {
    for (const entry of state.entries.values()) {
      if (entry[".tag"] !== "file") continue;
      if (!entry.path_lower?.endsWith(".jpg")) continue;
      if (!entry.path_lower?.startsWith("/pics/camera/sliced")) continue;

      // Time sources:
      // client_modified
      // server_modified (maybe)
      // name
      // the directory it's in
      // maybe EXIF (requires content)

      // If client_modified matches the basename,
      // then everything's probably fine.

      const clientModified = parseTime(entry.client_modified);
      const filenameTime = getTimeFromFilename(entry.name);
      let offset: number | undefined = undefined;

      if (filenameTime) {
        offset = filenameTime.getTime() - clientModified.getTime();

        if (offset === 0 || offset === 3600000 || offset === 7200000) {
          continue;
        }
      }

      console.log(
        JSON.stringify({ entry, clientModified, filenameTime, offset })
      );
    }
  }
};

main();
