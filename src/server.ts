import { Router } from './router';
import { existsSync, readFileSync } from 'fs';
import glob from 'tiny-glob';
import { IMiddleware, IEndpoint, Request, IRoute } from './interfaces';
import { resolve } from 'path';
import { CLI } from './cli';
import { printConsole, print, pathMatch, formatPath } from './utils';
import { Response } from './response';
import http2 from 'http2';
import http from 'http';
import https from 'https';
import { Next } from './next';

function requestHandler(req: any, res: any) {
  const method = req.method !== undefined ? req.method.toLocaleLowerCase() : null;
  let path: string = req.url !== undefined ? req.url.split('?')[0] : null;
  if (method && path) {
    path = path.replace(/^\/+|\/+$/g, '');
    if (endpoints[method]) {
      for (const endpoint of endpoints[method]) {
        const params: { [k: string]: string } | null = pathMatch(endpoint.path, path);
        if (params) {
          const request: Request = {
            params,
            headers: req.headers,
          };
          const response = new Response(res, request, {
            global: {},
            ejs: {},
            file: '',
          });
          const next = new Next(response, request, endpoint.middlewares);
          endpoint.middlewares[0](request, response, next.next.bind(next));
          return;
        }
      }
    }
    const request: Request = {
      params: {},
      headers: req.headers,
    };
    const response = new Response(res, request, {
      global: {},
      ejs: {},
      file: '',
    });
    if (errors[404]) {
      response.status(404);
      const next = new Next(response, request, errors[404].middlewares);
      errors[404].middlewares[0](request, response, next.next.bind(next));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Not found',
        }),
      );
    }
  }
}

export class Server {
  private server: any;

  constructor() {
    if (existsSync('./api')) {
      glob('./api/**/*.{js,ts}').then((files) => {
        files.forEach((f) => {
          const endpoint = f.replace(/ /g, '-').replace(/\\/g, '/').replace(/\\/g, '/').split('/');
          if (endpoint[endpoint.length - 1] === 'index.js' || endpoint[endpoint.length - 1] === 'index.ts')
            endpoint.pop();
          import(resolve('./' + f)).then((module) => {
            //if (!(module instanceof Router)) print('error', `File '${f}' doesn't export a Router`, true);
            this.use(endpoint.join('/').replace('.js', '').replace('.ts', ''), module.default);
          });
        });
      });
    }

    if (global.settings.serverType === 'http') {
      this.server = http.createServer((req, res) => {
        requestHandler(req, res);
      });
    } else {
      if (
        global.settings.ssl === undefined ||
        global.settings.ssl.cert === undefined ||
        global.settings.ssl.key === undefined
      ) {
        print('error', 'You need to specify a key and a certificate to use HTTPS or HTTP/2', true);
      } else {
        if (global.settings.serverType === 'http2') {
          this.server = http2.createSecureServer(
            {
              key: readFileSync(global.settings.ssl.key),
              cert: readFileSync(global.settings.ssl.cert),
            },
            (req, res) => {
              requestHandler(req, res);
            },
          );
        } else {
          this.server = https.createServer(
            {
              key: readFileSync(global.settings.ssl.key),
              cert: readFileSync(global.settings.ssl.cert),
            },
            (req, res) => {
              requestHandler(req, res);
            },
          );
        }
      }
    }
  }

  use(...args: [path: string, middleware: IMiddleware | Router] | [middleware: IMiddleware | Router]) {}

  listen(callback?: () => void) {
    printConsole();
    global.started = true;
    if (global.isDev) CLI(this);
    this.server.listen(global.settings.port, global.settings.address, callback);
  }

  //#region Endpoints

  #Add(route: IRoute) {
    if (!global.endpoints[route.method]) global.endpoints[route.method] = [];
    else if (global.endpoints[route.method].find((e) => e.path === route.path)) {
      print('error', `Route ${route.method} ${route.path} already exists`);
      return;
    }
    global.endpoints[route.method].push({
      path: route.path,
      middlewares: route.middlewares,
      static: route.static || false,
    });
  }

  error(code: number, ...middlewares: IMiddleware[]) {
    global.errors[code] = {
      path: '',
      middlewares,
      static: false,
    };
  }

  get(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'get',
    });
  }

  put(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'put',
    });
  }

  post(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'post',
    });
  }

  patch(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'patch',
    });
  }

  options(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'options',
    });
  }

  delete(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'delete',
    });
  }

  head(path: string = '/', ...middlewares: IMiddleware[]) {
    this.#Add({
      path: formatPath(path),
      middlewares,
      method: 'head',
    });
  }

  //#endregion
}
