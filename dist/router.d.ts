import { Request } from './request';
import { Response } from './response';
import { Next } from './next';
export interface IMiddleware {
  (req: Request, res: Response, next?: Next): void;
}
interface Endpoint {
  path: string;
  middlewares: IMiddleware[];
  static: boolean;
}
export declare class Router {
  #private;
  endpoints: {
    [k: string]: Endpoint[];
  };
  public(path: string): void;
  get(path: string, ...middlewares: IMiddleware[]): void;
  post(path: string, ...middlewares: IMiddleware[]): void;
  put(path: string, ...middlewares: IMiddleware[]): void;
  patch(path: string, ...middlewares: IMiddleware[]): void;
  options(path: string, ...middlewares: IMiddleware[]): void;
  head(path: string, ...middlewares: IMiddleware[]): void;
  delete(path: string, ...middlewares: IMiddleware[]): void;
}
export {};
