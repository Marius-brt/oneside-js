import { IEndpoint, IMiddleware, IRoute } from './interfaces';
import { print, formatPath } from './utils';

export class Router {
  endpoints: { [k: string]: IEndpoint[] } = {};
  errors: { [k: string]: IEndpoint } = {};

  #Add(route: IRoute) {
    if (!this.endpoints[route.method]) this.endpoints[route.method] = [];
    else if (this.endpoints[route.method].find((e) => e.path === route.path)) {
      print('error', `Route ${route.method} ${route.path} already exists`);
      return;
    }
    this.endpoints[route.method].push({
      path: route.path,
      middlewares: route.middlewares,
      static: route.static || false,
    });
  }

  error(code: number, ...middlewares: IMiddleware[]) {
    this.errors[code] = {
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
}
