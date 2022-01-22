import { Request } from './request';
import { Response } from './response';
import { IMiddleware } from './router';

export class Next {
  private i = 0;
  constructor(private req: Request, private res: Response, private middlewares: IMiddleware[]) {}

  ok() {
    if (this.i + 2 < this.middlewares.length) {
      this.i++;
      this.middlewares[this.i](this.req, this.res, this);
    }
  }
}
