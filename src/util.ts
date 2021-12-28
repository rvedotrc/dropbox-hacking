export const formatTime = (date: Date): string =>
  date.toISOString().replace(/\.\d+Z$/, "Z");
