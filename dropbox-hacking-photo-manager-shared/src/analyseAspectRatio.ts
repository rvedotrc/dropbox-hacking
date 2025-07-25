export const analyseAspectRatio = (width: number, height: number) => {
  if (Math.ceil((width / 16) * 9) === height) return "16x9";
  if (Math.ceil((width / 4) * 3) === height) return "4x3";
  if (Math.ceil((width / 3) * 2) === height) return "3x2";

  if (Math.ceil((width / 9) * 16) === height) return "9x16";
  if (Math.ceil((width / 3) * 4) === height) return "3x4";
  if (Math.ceil((width / 2) * 3) === height) return "2x3";

  return null;

  //   if (
  //     !Number.isSafeInteger(width) ||
  //     !Number.isSafeInteger(height) ||
  //     width < 1 ||
  //     height < 1
  //   )
  //     throw new Error(`analyseAspectRatio requires positive integers`);

  //   let w = width;
  //   let h = height;
  //   let n = 2;
  //   const factors: number[] = [];

  //   while (true) {
  //     if (w % n === 0 && h % n === 0) {
  //       w /= n;
  //       h /= n;
  //       factors.push(n);
  //       continue;
  //     }

  //     n = n === 2 ? 3 : n + 2;

  //     if (n > w || n > h)
  //       return {
  //         input: [width, height] as const,
  //         output: [w, h] as const,
  //         primeFactors: factors,
  //         reducedBy: factors.reduce((acc, item) => acc * item, 1),
  //       };
  //   }
};
