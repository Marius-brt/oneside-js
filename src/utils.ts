import colors from 'ansi-colors';
import { IEndpoint } from './interfaces';
import { toString } from 'qrcode';
import { clearLine } from 'readline';

export function print(
  type: 'info' | 'success' | 'error' | 'failed' | 'log' | 'gray',
  message: string,
  fatal?: boolean,
) {
  if (global.started) {
    global.rl.pause();
    process.stdout.cursorTo(0);
    clearLine(process.stdout, 0);
  }
  switch (type) {
    case 'log':
      console.log(`${message}`);
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
  if (global.started) {
    global.rl.resume();
    global.rl.prompt();
  }
}

export function formatPath(path: string): string {
  return path
    .trim()
    .replace(/\s/g, '-')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

export function drawTree(endpoints: { [k: string]: IEndpoint[] }, errors: { [k: string]: IEndpoint }) {
  if (Object.entries(endpoints).length == 0) return print('info', 'No endpoints found');
  var tree: { [k: string]: any } = {};
  for (const [key, value] of Object.entries(endpoints)) {
    tree[key] = {};
    value.forEach((el) => {
      const splt: string[] = el.path.split('/');
      var parent: { [k: string]: any } = tree[key];
      for (var i = 0; i < splt.length; i++) {
        if (!parent[splt[i]]) {
          if (i == splt.length - 1) parent[splt[i]] = null;
          else parent[splt[i]] = {};
        }
        parent = parent[splt[i]];
      }
    });
  }
  for (const [key, value] of Object.entries(errors)) {
    if (!tree['errors']) tree['errors'] = {};
    tree['errors'][key] = null;
  }

  for (const [key, value] of Object.entries(tree)) {
    switch (key) {
      case 'get':
        console.log(colors.green('[GET]'));
        break;
      case 'post':
        console.log(colors.yellow('[POST]'));
        break;
      case 'put':
        console.log(colors.blue('[PUT]'));
        break;
      case 'patch':
        console.log('[PATCH]');
        break;
      case 'options':
        console.log('[OPTIONS]');
        break;
      case 'head':
        console.log('[HEAD]');
        break;
      case 'delete':
        console.log(colors.red('[DELETE]'));
        break;
      case 'errors':
        console.log(colors.red('[ERRORS]'));
        break;
    }
    drawBranch(value, 0, `[${key}]`.length);
  }
}

function drawBranch(child: { [k: string]: any }, oldOffset: number, offset: number, base: string = '') {
  if (base == '') base = ' '.repeat(offset - 1);
  const length = Object.keys(child).length;
  if (length == 1) {
    const txt = '└──' + (Object.keys(child)[0] == '' ? ' /' : Object.keys(child)[0]);
    console.log(base + txt);
    if (Object.values(child)[0] != null)
      drawBranch(Object.values(child)[0], offset, offset + txt.length - 1, base + ' '.repeat(txt.length - 1));
  } else {
    var i = 0;
    for (const [key, value] of Object.entries(child)) {
      const txt = (i < length - 1 && length > 1 ? '├──' : '└──') + (key == '' ? ' /' : key);
      console.log(base + txt);
      if (value != null)
        drawBranch(
          value,
          offset,
          offset + key.length,
          base + (i < length - 1 ? '│' + ' '.repeat(offset - 1 - (oldOffset - 1) - 1) : ' '.repeat(txt.length - 1)),
        );
      i++;
    }
  }
}

export function printConsole() {
  console.clear();
  const prefix = global.settings.serverType == 'http' ? 'http://' : 'https://';
  if (global.isDev) {
    toString(
      `${prefix}${global.settings.address}:${global.settings.port}`,
      { type: 'terminal', scale: 2 },
      (err, url) => {
        if (!err) console.log(url);
      },
    );
    console.log('');
    print('success', `OneSide running on ${prefix}${global.settings.address}:${global.settings.port}/\n`);
    print('info', 'Scan the QR Code to open the website on your phone.');
    print('info', 'Type "help" to get the list of commands.\n');
  } else {
    print('success', `OneSide running on ${prefix}${global.settings.address}:${global.settings.port}/\n`);
  }
}

export function pathMatch(model: string, path: string): { [k: string]: string } | null {
  const params: { [k: string]: string } = {};
  const modelSplt = model.split('/');
  const pathSplt = path.split('/');
  if (modelSplt.length != pathSplt.length) return null;
  for (let i = 0; i < modelSplt.length; i++) {
    if (modelSplt[i].charAt(0) == ':') {
      params[modelSplt[i].substring(1)] = pathSplt[i];
      continue;
    }
    if (modelSplt[i] == '*') continue;
    if (modelSplt[i] != pathSplt[i]) return null;
  }
  return params;
}
