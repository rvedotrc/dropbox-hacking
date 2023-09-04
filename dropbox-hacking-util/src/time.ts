export const formatTime = (date: Date): string =>
  date.toISOString().replace(/\.\d+Z$/, "Z");

export const parseTime = (date: string): Date => new Date(date);
