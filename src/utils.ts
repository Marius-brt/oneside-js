import colors from 'ansi-colors';

export function print(
  type: 'info' | 'success' | 'error' | 'failed' | 'log' | 'gray',
  message: string,
  fatal?: boolean,
) {
  switch (type) {
    case 'log':
      console.log(colors.green(`> ${message}`));
      break;
    case 'gray':
      console.log(colors.gray(`> ${message}`));
      break;
    case 'success':
      console.log(colors.green(`[SUCCESS] ${message}`));
      break;
    case 'info':
      console.log(colors.blue(`[INFO] ${message}`));
      break;
    case 'failed':
      console.log(colors.red(`[FAILED] ${message}`));
      if (fatal) process.exit(1);
      break;
    case 'error':
      console.log(colors.red(`[ERROR] ${message}`));
      if (fatal) process.exit(1);
      break;
  }
}

export function normalize(path: string): string {
  path = path.replace(/\\/g, '/');
  while (path.length > 0 && ['.', '/'].includes(path[0])) {
    path = path.substring(1);
  }
  return '/' + path;
}
