/// <reference types="node" />
import { ServerResponse } from 'http';
interface IResponseSettings {
  global: object;
  ejs: object;
  file: string;
  useCache: boolean;
  dev: boolean;
}
export declare class Response {
  private res;
  private settings;
  constructor(res: ServerResponse, settings: IResponseSettings);
  status(code: number): Response;
  global(data: object): Response;
  ejs(data: object): Response;
  setHeader(name: string, value: string): void;
  json(data: object): void;
  send(text: string): void;
  rest(data?: any): void;
  render(page: string): void;
  isSended(): boolean;
}
export {};
