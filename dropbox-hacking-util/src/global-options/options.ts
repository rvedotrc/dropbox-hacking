export const processOptions = (
  argv: string[],
  spec: Record<string, (argv: string[]) => void>,
): string[] => {
  const output = [...argv];

  while (true) {
    const opt = output[0];
    if (opt === undefined) break;

    if (!(opt in spec)) break;
    output.shift();
    spec[opt](output);
  }

  return output;
};
