'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Next = void 0;
class Next {
  constructor(req, res, middlewares) {
    this.req = req;
    this.res = res;
    this.middlewares = middlewares;
    this.i = 0;
  }
  ok() {
    this.i++;
    this.middlewares[this.i](this.req, this.res, this);
  }
}
exports.Next = Next;
