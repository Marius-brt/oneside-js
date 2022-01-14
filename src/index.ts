import express, { Response, Router } from 'express';
import cookieParser from 'cookie-parser';
import figlet, { Fonts } from 'figlet';
import color from 'ansi-colors';
import { get } from 'https';

import { Settings } from './settings';
import { Server } from './server';
import { Render } from './render';

let useEjsCache = true;

export function router(options?: express.RouterOptions): Router {
  return Router(options);
}

export function render(file: string, res: Response): Render {
  return new Render(file, res, process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev', useEjsCache);
}

export function init(settings: Partial<Settings> = {}): Server {
  if (settings.ejsCache !== undefined) useEjsCache = settings.ejsCache;
  const fonts: Fonts[] = ['Ghost', 'Sub-Zero', 'Delta Corps Priest 1', 'Dancing Font', 'DOS Rebel', 'ANSI Regular'];
  console.log(
    color.yellow(
      figlet.textSync('OneSide', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
      }),
    ),
  );
  get('https://api.npms.io/v2/package/oneside', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const version = require('../package.json').version;
      const latest = JSON.parse(data).collected.metadata.version;
      if (version !== latest) {
        console.log(
          color.cyan(
            `?> New version of OneSide available ${version}->${latest}. Use the "npm i oneside@latest" command to install the latest version available.`,
          ),
        );
      }
    });
  });
  const app = express();
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.use(cookieParser());
  return new Server(app, settings);
}
