export const ensureNever = (_: never) => {
  throw new Error("ensureNever failed");
};
