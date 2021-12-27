export const formatTime = (date: Date) =>
  date.toISOString().replace(/\.\d+Z$/, "Z");
