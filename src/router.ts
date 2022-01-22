import { normalize, resolve } from 'path';
import { statSync, existsSync } from 'fs';
import glob from 'tiny-glob';

import { print } from './utils';
import { Request } from './request';
import { Response } from './response';
import { Next } from './next';

export interface IMiddleware {
  (req: Request, res: Response, next?: Next): void;
}

interface Route {
  method: 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete';
  path: string;
  middlewares: IMiddleware[];
  static?: boolean;
}

interface Endpoint {
  path: string;
  middlewares: IMiddleware[];
  static: boolean;
}

export class Router {
  endpoints: { [k: string]: Endpoint[] } = {};

  #Add(route: Route) {
    if (route.middlewares.length > 0 || route.static === true) {
      if (!this.endpoints[route.method]) this.endpoints[route.method] = [];
      else if (this.endpoints[route.method].find((el) => el.path === route.path)) return;
      this.endpoints[route.method].push({
        path: route.path.replace(/ /g, ''),
        middlewares: route.middlewares,
        static: route.static || false,
      });
    }
  }

  public(path: string) {
    if (path.startsWith('/')) path = `.${path}`;
    if (existsSync(path)) {
      if (statSync(path).isFile()) {
        this.#Add({
          path: `/${normalize(path).replace(/\\/g, '/')}`,
          method: 'get',
          middlewares: [],
          static: true,
        });
      } else {
        glob(`${resolve(path)}/**/*`)
          .then((files) => {
            files.forEach((file) => {
              this.#Add({
                path: `/${normalize(file).replace(/\\/g, '/')}`,
                method: 'get',
                middlewares: [],
                static: true,
              });
            });
          })
          .catch((err) => {
            print('failed', `Failed to load static files !\n${err}`);
          });
      }
    }
  }

  get(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'get',
    });
  }

  post(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'post',
    });
  }

  put(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'put',
    });
  }

  patch(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'patch',
    });
  }

  options(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'options',
    });
  }

  head(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'head',
    });
  }

  delete(path: string, ...middlewares: IMiddleware[]) {
    this.#Add({
      path,
      middlewares,
      method: 'delete',
    });
  }
}
