import { Router, IMiddleware } from './router';
export interface AppSettings {
  port: number;
  address: string;
  global: object;
  baseFile: string;
  favicon: string;
  useLocalIp: boolean;
  showCompiling: boolean;
  ignores: (string | RegExp)[];
  printPublicUri: boolean;
  publicPaths: string[];
  parseCookies: boolean;
  parserBody: boolean;
  paths: {
    public: string;
    components: string;
    views: string;
  };
}
export declare class Application extends Router {
  private middlewares;
  private server;
  private settings;
  private io?;
  private dev;
  constructor(settings: Partial<AppSettings>);
  use(...args: [path: string, middleware: IMiddleware | Router] | [middleware: IMiddleware | Router]): void;
  listen(callback?: () => void): void;
}
