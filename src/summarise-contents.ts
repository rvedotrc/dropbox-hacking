import * as StreamValues from "stream-json/streamers/StreamValues";

const stats = new Map<string, { count: number; size: number }>();

process.stdin
  .pipe(StreamValues.withParser())
  .on("data", (data) => {
    const item = data.value;
    if (item[".tag"] === "file") {
      // console.log(item);
      const dots = item.name.split(".");
      const ext = dots.pop().toLowerCase();
      // console.log(ext);

      const stat = stats.get(ext) || { count: 0, size: 0 };
      stats.set(ext, { count: stat.count + 1, size: stat.size + item.size });
    }
  })
  .on("error", (error) => {
    throw error;
  })
  .on("end", () => {
    for (const [ext, stat] of stats.entries()) {
      console.log(`${ext}\t${stat.count}\t${stat.size}`);
    }
  });
