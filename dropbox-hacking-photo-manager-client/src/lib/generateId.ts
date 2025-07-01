let n = 0;

export default (): string => `${new Date().getTime()}:${++n}`;
