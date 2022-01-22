import { Request } from './request';
import { Response } from './response';
import { IMiddleware } from './router';
export declare class Next {
  private req;
  private res;
  private middlewares;
  private i;
  constructor(req: Request, res: Response, middlewares: IMiddleware[]);
  ok(): void;
}
