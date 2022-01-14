import express from 'express';
import cookieParser from 'cookie-parser';

import { Settings } from './settings';
import { Server } from './server';

export function init(settings: Partial<Settings> = {}): Server {
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
