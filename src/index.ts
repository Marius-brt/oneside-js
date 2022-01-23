import figlet, { Fonts } from 'figlet';
import color from 'ansi-colors';
import { get } from 'https';
import { readFileSync } from 'fs';
import { join } from 'path';

import { Application, AppSettings } from './server';
import { print } from './utils';
import { Router } from './router';

export function router(): Router {
  return new Router();
}

export function init(settings: Partial<AppSettings> = {}): Application {
  console.clear();
  const fonts: Fonts[] = ['Ghost', 'Sub-Zero', 'Delta Corps Priest 1', 'Dancing Font', 'DOS Rebel', 'ANSI Regular'];
  console.log(
    color.yellow(
      figlet.textSync('OneSide', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
      }),
    ),
  );
  try {
    get('https://registry.npmjs.org/oneside/latest', (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        const version = JSON.parse(readFileSync(join(__dirname, '../package.json'), { encoding: 'utf-8' })).version;
        const latest = JSON.parse(data).version;
        if (version !== latest)
          print(
            'info',
            `New version of OneSide available ${version} (current) -> ${latest}. Use the "npm i oneside@latest" command to install the latest version available.`,
          );
      });
    });
  } catch (ex) {
    // empty
  }
  return new Application(settings);
}
