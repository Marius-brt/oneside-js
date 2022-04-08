import { IMiddleware, Request } from './interfaces';
import { Response } from './response';

export class Next {
  private i = 1;
  constructor(private res: Response, private req: Request, private middlewares: IMiddleware[]) {}

  next() {
    if (this.i < this.middlewares.length) {
      this.middlewares[this.i](this.req, this.res, this.next.bind(this));
      this.i++;
    }
  }
}
