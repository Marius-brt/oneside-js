import express, { Response, Router } from 'express';
import cookieParser from 'cookie-parser';
import figlet, { Fonts, Options } from 'figlet';
import color from 'ansi-colors';

import { Settings } from './settings';
import { Server } from './server';
import { Render } from './render';

export function router(options?: express.RouterOptions): Router {
  return Router(options);
}

export function render(file: string, res: Response): Render {
  return new Render(file, res, process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev');
}

export function init(settings: Partial<Settings> = {}): Server {
  console.clear();
  const fonts: Fonts[] = ['Ghost', 'Sub-Zero', 'Delta Corps Priest 1', 'Dancing Font', 'DOS Rebel', 'ANSI Regular'];
  console.log(
    color.yellow(
      figlet.textSync('OneSide', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
      }),
    ),
  );
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
