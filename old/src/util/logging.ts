export const writeStdout = (message: string): Promise<void> =>
  new Promise((resolve, reject) =>
    process.stdout.write(message, (err) => (err ? reject(err) : resolve()))
  );

export const writeStderr = (message: string): Promise<void> =>
  new Promise((resolve, reject) =>
    process.stderr.write(message, (err) => (err ? reject(err) : resolve()))
  );
