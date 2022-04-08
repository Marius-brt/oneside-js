import { Server } from './server';
import { ISettings, IEndpoint } from './interfaces';
import * as router from './router';
import { Interface } from 'readline';
import merge from 'deepmerge';
import { cors } from './plugins/cors';
import * as cookie from './plugins/cookieParser';

declare global {
  var isDev: boolean;
  var firstLaunch: boolean;
  var started: boolean;
  var rl: Interface;
  var settings: ISettings;
  var endpoints: { [k: string]: IEndpoint[] };
  var errors: { [k: string]: IEndpoint };
}

const defaultSettings: ISettings = {
  port: 5000,
  address: 'localhost',
  serverType: 'http',
};

export const Cors = cors;
export const cookieParser = cookie.cookieParser;

export function Router(): router.Router {
  return new router.Router();
}

export default (settings: Partial<ISettings> = {}): Server => {
  global.endpoints = {};
  global.errors = {};
  global.settings = merge(defaultSettings, settings);
  global.started = false;
  global.isDev = process.argv.length > 2 && process.argv[2] === 'dev';
  global.firstLaunch = global.isDev && process.argv.length > 3 && process.argv[3] === 'first';
  return new Server();
};
