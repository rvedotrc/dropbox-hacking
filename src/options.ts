export const processOptions = (
  argv: string[],
  spec: Record<string, () => void>
): string[] => {
  const output = [...argv];

  while (true) {
    const opt = output[0];
    if (opt === undefined) break;

    if (!(opt in spec)) break;
    spec[opt]();
    output.shift();
  }

  return output;
};
