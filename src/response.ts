import { ServerResponse } from 'http';
import merge from 'deepmerge';
import ejs from 'ejs';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { STATUS_CODES } from 'http';

import { print } from './utils';

interface IResponseSettings {
  global: object;
  ejs: object;
  file: string;
  useCache: boolean;
  dev: boolean;
}

export class Response {
  constructor(private res: ServerResponse, private settings: IResponseSettings) {}

  status(code: number): Response {
    this.res.statusCode = code;
    return this;
  }

  global(data: object): Response {
    this.settings.global = merge(this.settings.global, data);
    return this;
  }

  ejs(data: object): Response {
    this.settings.ejs = data;
    return this;
  }

  setHeader(name: string, value: string) {
    this.res.setHeader(name, value);
  }

  json(data: object) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'application/json');
      this.res.end(JSON.stringify(data));
    }
  }

  send(text: string) {
    if (!this.res.writableEnded) this.res.end(typeof text === 'object' ? JSON.stringify(text) : text);
  }

  rest(data?: any) {
    const msg: { [k: string]: any } = {
      success: this.res.statusCode < 300,
      message: STATUS_CODES[this.res.statusCode],
      status: this.res.statusCode,
    };
    if (data) {
      if (this.res.statusCode < 300) msg.data = data;
      else msg.error = data;
    }
    this.json(msg);
  }

  redirect(url: string) {
    if (!this.res.writableEnded)
      this.res
        .writeHead(301, {
          Location: url,
        })
        .end();
  }

  render(page: string) {
    if (!this.res.writableEnded) {
      this.settings.file = page.replace('.ejs', '');
      const pth = resolve(join('./compiled', `${this.settings.file}.ejs`));
      if (this.settings.dev && !existsSync(pth)) {
        this.status(404).send(`File ${pth} doesnt exist`);
        print('error', `File ${pth} not found !`);
        return;
      }
      this.res.setHeader('Content-Type', 'text/html');
      ejs.renderFile(pth, this.settings.ejs, { cache: !this.settings.dev && this.settings.useCache }, (err, html) => {
        if (err) {
          print('failed', `Failed to render page !\n${err}`);
          this.res.statusCode = 500;
          if (this.settings.dev)
            return this.res
              .end(`<p>Failed to render page !</p><div>${err}</div><script src="/socket.io/socket.io.js"></script>
				  <script>
				  const socket = io();
				  let live_s_connected = false;
				  socket.on('connected_live', () => {
					  if(live_s_connected) location.reload()
					  live_s_connected = true;
					  console.log("Connected to OneSide Live Server !")
				  })
				  socket.on('reload_live', () => {
					  location.reload()
				  })
				  </script>`);
          else return this.res.end(`<p>Failed to render page !</p>`);
        }
        if (Object.keys(this.settings.global).length > 0)
          html = html.replace('$GLOBAL$', `<script>const global = ${JSON.stringify(this.settings.global)}</script>`);
        else html = html.replace('$GLOBAL$', '');
        this.res.end(html);
      });
    }
  }

  isSended(): boolean {
    return this.res.writableEnded;
  }
}
