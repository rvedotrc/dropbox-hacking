let n = 0;

export const generateId = (): string => `${new Date().getTime()}:${++n}`;
