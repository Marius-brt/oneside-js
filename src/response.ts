import { Request, ICookie, IResponse } from './interfaces';
import { STATUS_CODES } from 'http';
import { Next } from './next';

export class Response {
  constructor(private res: any, private req: Request, private settings: IResponse) {}

  status(code: number): Response {
    this.res.statusCode = code;
    return this;
  }

  error(code: number) {
    if (!this.res.writableEnded && global.errors[code]) {
      const next = new Next(this, this.req, global.errors[code].middlewares);
      global.errors[code].middlewares[0](this.req, this, next.next.bind(next));
    }
  }

  setHeader(key: string, value: string): Response {
    if (!this.res.writableEnded) this.res.setHeader(key, value);
    return this;
  }

  json(data: object) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'application/json');
      this.res.end(JSON.stringify(data));
    }
  }

  send(data: string) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'text/plain');
      this.res.end(data);
    }
  }

  html(data: string) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'text/html');
      this.res.end(data);
    }
  }

  rest(...args: [message?: string, data?: object] | [data?: object]) {
    const msg = args.length > 0 && typeof args[0] == 'string' ? args[0] : null;
    const result: { [k: string]: any } = {
      success: this.res.statusCode < 300,
      message: msg || STATUS_CODES[this.res.statusCode],
      status: this.res.statusCode,
    };
    if (args.length > 0 && typeof args[0] == 'object') result.data = args[0];
    else if (args.length == 2 && typeof args[1] == 'object') result.data = args[1];
    this.json(result);
  }

  redirect(url: string) {
    if (!this.res.writableEnded)
      this.res
        .writeHead(301, {
          Location: url,
        })
        .end();
  }

  isEnded(): boolean {
    return this.res.writableEnded;
  }

  setCookies(cookies: { [k: string]: string | ICookie }): Response {
    if (!this.res.writableEnded) {
      if (Object.entries(cookies).length > 0) {
        const list = [];
        for (const [key, value] of Object.entries(cookies)) {
          if (typeof value === 'string') {
            list.push(`${key}=${value}; `);
          } else {
            var el = `${key}=${value.value}; `;
            if (value.path) el += `Path=${value.path}; `;
            if (value.domain) el += `Domain=${value.domain}; `;
            if (value.expires) el += `Expires=${value.expires.toUTCString()}; `;
            if (value.maxAge) el += `Max-Age=${value.maxAge}; `;
            if (value.httpOnly) el += `HttpOnly; `;
            if (value.secure) el += `Secure; `;
            if (value.sameSite) el += `SameSite=${value.sameSite}; `;
            list.push(el);
          }
        }
        this.res.setHeader('Set-Cookie', list);
      }
    }
    return this;
  }
}
