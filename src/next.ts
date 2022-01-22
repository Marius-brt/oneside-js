import { Request } from './request';
import { Response } from './response';
import { IMiddleware } from './router';

export class Next {
  private i = 0;
  private ended = false;
  constructor(
    private req: Request,
    private res: Response,
    private middlewares: IMiddleware[],
    private notFoundEndpoint: IMiddleware | undefined,
  ) {}

  ok() {
    if (!this.ended && this.middlewares[this.i + 1]) {
      this.i++;
      this.middlewares[this.i](this.req, this.res, this);
    }
  }

  notFound() {
    if (!this.ended) {
      if (this.notFoundEndpoint) {
        this.notFoundEndpoint(this.req, this.res, this);
      } else {
        this.res.send(`<p>404 not found</p>`);
      }
    }
  }
}
