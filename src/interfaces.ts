import { Response } from './response';

export interface ISettings {
  port: number;
  address: string;
  serverType: 'http' | 'https' | 'http2';
  ssl?: {
    key: string;
    cert: string;
  };
}

export interface IRoute {
  method: 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete';
  path: string;
  middlewares: IMiddleware[];
  static?: boolean;
}

export interface IEndpoint {
  path: string;
  middlewares: IMiddleware[];
  static: boolean;
}

export interface IMiddleware {
  (req: Request, res: Response, next: () => void): void;
}

export interface Request {
  params: { [k: string]: string };
  headers: { [k: string]: string };
  cookies?: { [k: string]: string };
}

export interface ICookie {
  value: string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface IResponse {
  global: object;
  ejs: object;
  file: string;
}

export interface ICors {
  origin?: string;
  methods?: ('get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete')[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
