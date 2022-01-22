export declare function print(
  type: 'info' | 'success' | 'error' | 'failed' | 'log' | 'gray',
  message: string,
  fatal?: boolean,
): void;
export declare function normalize(path: string): string;
